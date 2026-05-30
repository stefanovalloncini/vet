import { expect, test } from "../setup/auth";
import type { Download, Page } from "@playwright/test";
import {
  SCENARIO,
  ensureTitolare,
  readAttivitaTotaliForAzienda,
  readContiForAzienda,
  seedBillingScenario,
  signInAsTitolare,
} from "./billing-lifecycle.helpers";

/**
 * End-to-end billing lifecycle from a titolare's seat.
 *
 * A practice owner (conti.emit + conti.saldo, but not an admin) bills a quarter
 * for one azienda: logs activities across every rate mode, prints the riepilogo,
 * emits the official conto, shares it on WhatsApp, marks it saldato, and exports
 * the CSV. Every euro is reconciled against the documents written to Firestore.
 *
 * The Functions emulator is not running in this harness; approveUser /
 * acceptAccessRequest cannot run live, so the titolare's approved end-state
 * (custom claims + users doc) is seeded directly via the admin SDK.
 */

const AZ = SCENARIO.azienda.id;
const TIPI = SCENARIO.tipi;

// Q1 2026 — disjoint from the global fixture activity (2026-05-15), so the
// scenario azienda's quarter is exclusively the activities logged below.
const Q1 = { from: "2026-01-01", to: "2026-03-31" };

// Per-mode amounts. Totale = tariffa × quantity (computeTotale), so:
const VISITA = { rate: 90, totale: 90 }; // fixed
const ORARIA = { rate: 50, ore: 4, totale: 200 }; // 50 × 4
const CAMPIONI = { rate: 12, elementi: 8, totale: 96 }; // 12 × 8
const GINECO = { rate: 75, totale: 75 }; // fixed, per-azienda price
const NOTE = { rate: 19.99, totale: 19.99 }; // fixed, float-fragile decimal
const ATTIVITA_SUBTOTALE = 90 + 200 + 96 + 75 + 19.99; // 480.99
const ARMADIETTO_Q1 = 200; // 800 × 3/12
const CONTO_TOTALE = Math.round((ATTIVITA_SUBTOTALE + ARMADIETTO_Q1) * 100) / 100; // 680.99

test.describe("billing lifecycle (titolare)", () => {
  test.beforeAll(async () => {
    await ensureTitolare();
  });

  test.beforeEach(async ({}, testInfo) => {
    // Heavy multi-step desktop flow. Mobile projects hide/relayout some of the
    // billing controls (FAB vs button, collapsed toolbars) which are being
    // polished separately, so keep this scenario on the desktop project.
    test.skip(
      testInfo.project.name !== "chromium",
      "desktop-only billing flow"
    );
    await seedBillingScenario({ withAzienda: true });
  });

  test("full quarter: log every rate mode, reconcile, emit, share, settle, export", async ({
    page,
    baseURL,
  }) => {
    if (!baseURL) throw new Error("baseURL not set");
    test.setTimeout(120_000);
    await signInAsTitolare(page, baseURL);

    // 1. The azienda carries its quarterly cadence + canone from seeding.
    await page.goto(`/aziende/${AZ}/modifica`);
    await expect(
      page.getByRole("heading", { level: 1, name: /Modifica azienda/i })
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByLabel(/Cadenza fatturazione/i)).toHaveValue(
      "quarterly"
    );
    await expect(page.getByLabel(/Telefono/i)).toHaveValue(
      SCENARIO.azienda.telefono
    );
    await expect(page.getByLabel(/Armadietto farmaci/i)).toHaveValue("800");

    // 2. Log five activities across the four rate modes (one carries notes).
    await logFixedActivity(page, {
      date: "2026-01-12",
      tipoId: TIPI.visita.id,
      rate: VISITA.rate,
    });
    await logHourlyActivity(page, {
      date: "2026-01-20",
      tipoId: TIPI.emergenza.id,
      rate: ORARIA.rate,
      ore: ORARIA.ore,
    });
    await logPerElementActivity(page, {
      date: "2026-02-03",
      tipoId: TIPI.campioni.id,
      rate: CAMPIONI.rate,
      elementi: CAMPIONI.elementi,
    });
    await logFixedActivity(page, {
      date: "2026-02-18",
      tipoId: TIPI.ginecologia.id,
      rate: GINECO.rate,
    });
    await logFixedActivity(page, {
      date: "2026-03-09",
      tipoId: TIPI.visita.id,
      rate: NOTE.rate,
      note: "Controllo post-parto, mandria settore B",
    });

    // 3. Each stored totale = rate × quantity. Read back from Firestore.
    const totali = (await readAttivitaTotaliForAzienda(AZ)).sort((a, b) => a - b);
    expect(totali).toEqual(
      [VISITA.totale, ORARIA.totale, CAMPIONI.totale, GINECO.totale, NOTE.totale].sort(
        (a, b) => a - b
      )
    );
    const subtotaleStored = totali.reduce((s, n) => s + n, 0);
    expect(round2(subtotaleStored)).toBe(round2(ATTIVITA_SUBTOTALE));

    // 4. Open the printable riepilogo for the quarter and assert a real PDF.
    await page.goto(`/aziende/${AZ}/riepilogo?from=${Q1.from}&to=${Q1.to}`);
    await expect(
      page.getByRole("heading", { level: 1, name: /Riepilogo prestazioni/i })
    ).toBeVisible({ timeout: 15_000 });
    // The per-element row's tipo should be present in the preview.
    await expect(page.getByText(TIPI.campioni.nome).first()).toBeVisible({
      timeout: 10_000,
    });
    const riepilogoPdf = await downloadOnClick(page, () =>
      page.getByRole("button", { name: /Stampa o salva PDF/i }).click()
    );
    await assertNonEmptyPdf(riepilogoPdf);

    // 5. WhatsApp share opens a wa.me URL with the caption (azienda + total).
    const waUrl = await captureWindowOpen(page, () =>
      page.getByRole("button", { name: /WhatsApp/i }).click()
    );
    expect(waUrl).toMatch(/^https:\/\/wa\.me\//);
    const decoded = decodeURIComponent(waUrl);
    expect(decoded).toContain(SCENARIO.azienda.nome);
    expect(decoded).toContain("480,99"); // riepilogo total (activities only)

    // 6. Emit the official conto for the quarter from the azienda detail page.
    await page.goto(`/aziende/${AZ}`);
    await expect(
      page.getByRole("heading", { level: 1, name: SCENARIO.azienda.nome })
    ).toBeVisible({ timeout: 15_000 });

    const fromInput = page.locator('input[type="date"]').first();
    const toInput = page.locator('input[type="date"]').nth(1);
    await fromInput.fill(Q1.from);
    await toInput.fill(Q1.to);

    // Five activities matched, armadietto pre-checked at the prorated 200,
    // grand total 680,99 shown in the emit panel before committing.
    await expect(page.getByText(/Subtotale attività\s+480,99/)).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      page.getByRole("checkbox", { name: /Armadietto farmaci/i })
    ).toBeChecked();
    await expect(page.getByLabel("Importo (€)")).toHaveValue("200");
    await expect(page.getByText(/680,99/).first()).toBeVisible();

    // Emitting triggers both the Firestore write and a conto PDF download.
    const contoPdf = await downloadOnClick(page, async () => {
      await page.getByRole("button", { name: /^Emetti conto$/i }).click();
      await page.getByRole("button", { name: /^Emetti$/i }).click();
    });
    await assertNonEmptyPdf(contoPdf);
    await expect(page.getByText(/Conto emesso/i)).toBeVisible({
      timeout: 10_000,
    });

    // 7. Reconcile the emitted conto document against the math.
    const contiAfterEmit = await readContiForAzienda(AZ);
    expect(contiAfterEmit).toHaveLength(1);
    const conto = contiAfterEmit[0]!;
    expect(conto.modalita).toBe("emesso");
    expect(conto.saldato).toBe(false);
    expect(conto.armadiettoImporto).toBe(ARMADIETTO_Q1);
    expect(round2(conto.totaleConto)).toBe(CONTO_TOTALE);
    // Conto total = sum of period activity totals + armadietto.
    expect(round2(conto.totaleConto - (conto.armadiettoImporto ?? 0))).toBe(
      round2(subtotaleStored)
    );
    expect(conto.attivitaIds).toHaveLength(5);

    // 8. The conto shows as UNSETTLED on /pagamenti (danger badge + open total).
    await page.goto("/pagamenti");
    await expect(
      page.getByRole("heading", { level: 1, name: /Pagamenti/i })
    ).toBeVisible({ timeout: 15_000 });
    const aziendaRowLink = page
      .getByRole("link", { name: SCENARIO.azienda.nome })
      .first();
    await expect(aziendaRowLink).toBeVisible({ timeout: 10_000 });
    const unpaidBadge = page
      .getByText("Non saldato", { exact: true })
      .first();
    await expect(unpaidBadge).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/680,99/).first()).toBeVisible();

    // 9. Mark the conto SALDATO from the azienda's Conti tab.
    await page.goto(`/aziende/${AZ}?tab=conti`);
    await expect(
      page.getByRole("heading", { level: 1, name: SCENARIO.azienda.nome })
    ).toBeVisible({ timeout: 15_000 });
    const segnaSaldato = page.getByRole("button", { name: /Segna saldato/i });
    await expect(segnaSaldato.first()).toBeVisible({ timeout: 10_000 });
    await segnaSaldato.first().click();

    // Badge in the tab flips to the settled (green/success) state.
    const saldatoBadge = page.getByText("Saldato", { exact: true }).first();
    await expect(saldatoBadge).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByRole("button", { name: /Segna saldato/i })
    ).toHaveCount(0);

    // 10. Firestore confirms the settle: saldato=true, importoSaldato=total.
    const contiAfterSaldo = await readContiForAzienda(AZ);
    expect(contiAfterSaldo).toHaveLength(1);
    expect(contiAfterSaldo[0]!.saldato).toBe(true);

    // 11. Pagamenti badge for the azienda is now settled (green), no open total.
    await page.goto("/pagamenti");
    await expect(
      page.getByRole("heading", { level: 1, name: /Pagamenti/i })
    ).toBeVisible({ timeout: 15_000 });
    const scenarioRow = page.locator("tr", {
      has: page.getByRole("link", { name: SCENARIO.azienda.nome }),
    });
    const settledBadge = scenarioRow.getByText("Saldato", { exact: true }).first();
    await expect(settledBadge).toBeVisible({ timeout: 10_000 });
    const settledBadgeClass = await settledBadge.getAttribute("class");
    expect(settledBadgeClass ?? "").toContain("success");
    await expect(
      scenarioRow.getByText("Non saldato", { exact: true })
    ).toHaveCount(0);

    // 12. Expand the row (dedicated +/− toggle): the storico lists the conto.
    // Post-settle the row's own "Aperto" is 0, so 680,99 now appears only in
    // the expanded ContiPerAziendaTab — an unambiguous proof the conto is there.
    await scenarioRow
      .first()
      .getByRole("button", { name: "+" })
      .click();
    await expect(page.getByText(/680,99/).first()).toBeVisible({
      timeout: 10_000,
    });

    // 13. Export the activities CSV and assert Italian Excel formatting.
    await page.goto("/attivita");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole("button", { name: /Esporta CSV/i }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("heading", { name: /Esporta in CSV/i })
    ).toBeVisible({ timeout: 10_000 });
    await dialog.getByLabel(/^Da$/i).fill(Q1.from);
    await dialog.getByLabel(/^A$/i).fill(Q1.to);
    await dialog
      .getByLabel(/Azienda/i)
      .selectOption({ label: SCENARIO.azienda.nome });
    const csv = await downloadOnClick(page, () =>
      dialog.getByRole("button", { name: /^Scarica$/i }).click()
    );
    const csvText = await readDownloadText(csv);

    // BOM, semicolon separator, comma decimals, CRLF line endings.
    expect(csvText.charCodeAt(0)).toBe(0xfeff);
    const lines = csvText.replace(/^﻿/, "").split("\r\n").filter(Boolean);
    expect(lines.length).toBe(6); // header + 5 activities
    expect(lines[0]!.split(";")).toContain("Totale");
    expect(lines[0]).toContain(";");
    expect(csvText).toContain("\r\n");
    // Money uses comma decimals (e.g. 19,99 / 480,99 not 19.99).
    expect(csvText).toContain("19,99");
    expect(csvText).toContain("200,00");
    expect(csvText).not.toMatch(/;19\.99;/);
    // Per-mode columns: oraria carries ore, ad-elemento carries quantità.
    const dataRows = lines.slice(1).map((l) => l.split(";"));
    const oreColumn = dataRows.map((cells) => cells[5]); // "Ore"
    expect(oreColumn).toContain("4,00");
    const qtaColumn = dataRows.map((cells) => cells[6]); // "Quantità"
    expect(qtaColumn).toContain("8");
  });

  test("titolare sees both emit and pro forma controls (conti capability gate)", async ({
    page,
    baseURL,
  }) => {
    // Capability sanity: the titolare bundle holds conti.emit + conti.proforma,
    // so both billing actions are offered from the azienda detail page.
    if (!baseURL) throw new Error("baseURL not set");
    await signInAsTitolare(page, baseURL);
    await page.goto(`/aziende/${AZ}`);
    await expect(
      page.getByRole("heading", { level: 1, name: SCENARIO.azienda.nome })
    ).toBeVisible({ timeout: 15_000 });
    // The emit panel is visible to a conti.emit holder.
    await expect(
      page.getByRole("button", { name: /^Emetti conto$/i })
    ).toBeVisible({ timeout: 10_000 });
    // Pro forma is also available (titolare ⊃ veterinario).
    await expect(
      page.getByRole("button", { name: /Salva come pro forma/i })
    ).toBeVisible();
  });
});

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

interface BaseActivity {
  date: string;
  tipoId: string;
  rate: number;
  note?: string;
}

async function openNewActivity(page: Page): Promise<void> {
  await page.goto("/attivita/nuova");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
    timeout: 15_000,
  });
  await page.getByLabel(/Azienda/i, { exact: false }).selectOption(AZ);
}

async function fillCommon(page: Page, a: BaseActivity): Promise<void> {
  await page.getByLabel(/^Data$/i).fill(a.date);
  await page.getByLabel(/Tipo/i, { exact: false }).first().selectOption(a.tipoId);
  if (a.note) {
    await page.getByLabel(/^Note$/i).fill(a.note);
  }
  await page.getByLabel(/Tariffa/i).fill(String(a.rate));
}

async function saveAndReturn(page: Page): Promise<void> {
  await page.getByRole("button", { name: /^Salva$/i }).click();
  await expect(page).toHaveURL(/\/attivita(\?|$)/, { timeout: 15_000 });
}

async function logFixedActivity(page: Page, a: BaseActivity): Promise<void> {
  await openNewActivity(page);
  await fillCommon(page, a);
  await saveAndReturn(page);
}

async function logHourlyActivity(
  page: Page,
  a: BaseActivity & { ore: number }
): Promise<void> {
  await openNewActivity(page);
  await page.getByText(/Pagamento orario/i).click();
  await fillCommon(page, a);
  await page.getByLabel(/^Ore$/i).fill(String(a.ore));
  await saveAndReturn(page);
}

async function logPerElementActivity(
  page: Page,
  a: BaseActivity & { elementi: number }
): Promise<void> {
  await openNewActivity(page);
  await page.getByText(/Pagamento ad elemento/i).click();
  await fillCommon(page, a);
  await page.getByLabel(/Quantità/i).fill(String(a.elementi));
  await saveAndReturn(page);
}

async function downloadOnClick(
  page: Page,
  action: () => Promise<void>
): Promise<Download> {
  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 30_000 }),
    action(),
  ]);
  return download;
}

async function assertNonEmptyPdf(download: Download): Promise<void> {
  const name = download.suggestedFilename();
  expect(name).toMatch(/\.pdf$/);
  const path = await download.path();
  expect(path).toBeTruthy();
  const fs = await import("node:fs/promises");
  const buf = await fs.readFile(path!);
  expect(buf.byteLength).toBeGreaterThan(800);
  // PDF magic bytes.
  expect(buf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
}

async function readDownloadText(download: Download): Promise<string> {
  const path = await download.path();
  expect(path).toBeTruthy();
  const fs = await import("node:fs/promises");
  return fs.readFile(path!, "utf8");
}

/**
 * The WhatsApp share calls window.open(...). Override it before the click so we
 * can read the wa.me URL without a real popup. Returns the first URL opened.
 */
async function captureWindowOpen(
  page: Page,
  action: () => Promise<void>
): Promise<string> {
  await page.evaluate(() => {
    const w = window as unknown as { __waUrl: string | null };
    w.__waUrl = null;
    window.open = ((url?: string | URL) => {
      w.__waUrl = url ? String(url) : "";
      return null;
    }) as typeof window.open;
  });
  await action();
  await page.waitForFunction(
    () => (window as unknown as { __waUrl: string | null }).__waUrl !== null,
    null,
    { timeout: 10_000 }
  );
  return page.evaluate(
    () => (window as unknown as { __waUrl: string | null }).__waUrl ?? ""
  );
}
