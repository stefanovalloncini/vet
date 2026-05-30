import { readFile } from "node:fs/promises";
import type { Download, Page } from "@playwright/test";
import { expect, test } from "../setup/auth";
import { FIXTURE, restoreSeededFixture } from "../setup/seed";
import {
  noonToday,
  seedAttivitaAt,
  seedReminderFor,
  softDeleteAttivita,
} from "./seed-extra";

const DOWNLOAD_ONLY_CHROMIUM =
  "blob anchor downloads only fire Playwright download events reliably on chromium";

async function readDownloadBytes(download: Download): Promise<Buffer> {
  const path = await download.path();
  expect(path, "download has no on-disk path").not.toBeNull();
  return readFile(path as string);
}

function isPdf(bytes: Buffer): boolean {
  return bytes.subarray(0, 5).toString("latin1") === "%PDF-";
}

test.describe("data safety: backup, trash, reminders, agenda, pdf", () => {
  test.beforeEach(async () => {
    await restoreSeededFixture();
  });

  test("backup completo: JSON carries all collections and CSV is Italian-Excel ready", async ({
    signedInVet,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", DOWNLOAD_ONLY_CHROMIUM);
    const reminderTitolo = `Backup richiamo ${Date.now().toString().slice(-6)}`;
    await seedReminderFor(reminderTitolo);

    await signedInVet.goto("/impostazioni");
    await expect(
      signedInVet.getByRole("heading", { level: 1, name: /Impostazioni/i })
    ).toBeVisible({ timeout: 15_000 });

    const jsonDownloadPromise = signedInVet.waitForEvent("download");
    await signedInVet.getByRole("button", { name: /Scarica JSON/i }).click();
    const jsonDownload = await jsonDownloadPromise;
    expect(jsonDownload.suggestedFilename()).toMatch(/\.json$/);

    const jsonBytes = await readDownloadBytes(jsonDownload);
    expect(jsonBytes.byteLength).toBeGreaterThan(0);

    const payload = JSON.parse(jsonBytes.toString("utf8")) as {
      version: number;
      exportedBy: string;
      aziende: Array<{ id?: string; nome?: string }>;
      attivita: Array<{ id?: string; aziendaId?: string }>;
      reminders: Array<{ id?: string; titolo?: string }>;
    };

    expect(payload.version).toBe(1);
    expect(payload.exportedBy).toBe(FIXTURE.vet.email);
    expect(Array.isArray(payload.aziende)).toBe(true);
    expect(Array.isArray(payload.attivita)).toBe(true);
    expect(Array.isArray(payload.reminders)).toBe(true);

    const seededAzienda = payload.aziende.find(
      (a) => a.nome === FIXTURE.azienda.nome
    );
    expect(seededAzienda, "seeded azienda present in backup").toBeTruthy();

    const seededAttivita = payload.attivita.find(
      (a) => a.aziendaId === FIXTURE.azienda.id
    );
    expect(seededAttivita, "seeded attivita present in backup").toBeTruthy();

    const seededReminder = payload.reminders.find(
      (r) => r.titolo === reminderTitolo
    );
    expect(seededReminder, "seeded reminder present in backup").toBeTruthy();

    const csvDownloadPromise = signedInVet.waitForEvent("download");
    await signedInVet.getByRole("button", { name: /Scarica CSV/i }).click();
    const csvDownload = await csvDownloadPromise;
    expect(csvDownload.suggestedFilename()).toMatch(/\.csv$/);

    const csvBytes = await readDownloadBytes(csvDownload);
    expect(csvBytes.byteLength).toBeGreaterThan(0);

    expect(
      csvBytes[0] === 0xef && csvBytes[1] === 0xbb && csvBytes[2] === 0xbf,
      "CSV starts with UTF-8 BOM"
    ).toBe(true);

    const csvText = csvBytes.toString("utf8");
    expect(csvText.charCodeAt(0)).toBe(0xfeff);
    const headerLine = csvText.replace(/^﻿/, "").split("\r\n")[0] ?? "";
    expect(headerLine).toContain(";");
    expect(headerLine).not.toContain(",");
    expect(headerLine).toContain("Data");
    expect(headerLine).toContain("Azienda");
    expect(csvText).toContain(FIXTURE.azienda.nome);
  });

  test("trash: soft-delete leaves the active list and lands in the cestino with a restore affordance", async ({
    signedInVet,
  }) => {
    const rowLink = (page: Page) =>
      page
        .getByRole("main")
        .getByRole("link")
        .filter({ hasText: FIXTURE.azienda.nome });

    await signedInVet.goto("/attivita");
    await expect(
      signedInVet.getByRole("heading", { level: 1, name: /^Attività$/i })
    ).toBeVisible({ timeout: 15_000 });
    await expect(rowLink(signedInVet).first()).toBeVisible({ timeout: 10_000 });

    await signedInVet.goto(`/attivita/${FIXTURE.attivita.id}`);
    await expect(
      signedInVet.getByRole("heading", { level: 1, name: /Modifica attività/i })
    ).toBeVisible({ timeout: 15_000 });

    await signedInVet.getByRole("button", { name: /^Elimina$/i }).click();
    await signedInVet
      .getByRole("dialog")
      .getByRole("button", { name: /^Elimina$/i })
      .click();

    await expect(signedInVet).toHaveURL(/\/attivita\/?$/, { timeout: 15_000 });
    await expect(
      signedInVet.getByText(/Nessuna attività registrata/i)
    ).toBeVisible({ timeout: 10_000 });
    await expect(rowLink(signedInVet)).toHaveCount(0);

    await signedInVet.goto("/cestino");
    await expect(
      signedInVet.getByRole("heading", { level: 1, name: /Cestino/i })
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      signedInVet.getByRole("main").getByText(FIXTURE.azienda.nome).first()
    ).toBeVisible({ timeout: 10_000 });

    await selectAllInCestino(signedInVet);
    const restore = signedInVet.getByRole("button", {
      name: /Ripristina selezionati/i,
    });
    await expect(restore).toBeEnabled({ timeout: 10_000 });
  });

  test("trash: admin sees a soft-deleted activity under 'Di tutti' with a purge affordance", async ({
    signedInAdmin,
  }) => {
    await softDeleteAttivita(FIXTURE.attivita.id);

    await signedInAdmin.goto("/cestino");
    await expect(
      signedInAdmin.getByRole("heading", { level: 1, name: /Cestino/i })
    ).toBeVisible({ timeout: 15_000 });

    const allTab = signedInAdmin.getByRole("tab", { name: /Di tutti/i });
    if (await allTab.isVisible().catch(() => false)) {
      await allTab.click();
    }

    await expect(
      signedInAdmin.getByRole("main").getByText(FIXTURE.azienda.nome).first()
    ).toBeVisible({ timeout: 10_000 });

    await selectAllInCestino(signedInAdmin);
    const purge = signedInAdmin.getByRole("button", {
      name: /Elimina selezionati/i,
    });
    await expect(purge).toBeEnabled({ timeout: 10_000 });
  });

  test("reminder un-complete does not crash the list and shows the reminder as open", async ({
    signedInVet,
  }) => {
    const consoleErrors: string[] = [];
    signedInVet.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await signedInVet.goto("/promemoria");
    await expect(
      signedInVet.getByRole("heading", { level: 1, name: /Promemoria/i })
    ).toBeVisible({ timeout: 15_000 });

    await signedInVet.getByRole("button", { name: /Nuovo promemoria/i }).click();
    await signedInVet
      .getByLabel(/Azienda/i, { exact: false })
      .selectOption(FIXTURE.azienda.id);
    const titolo = `Richiamo ${Date.now().toString().slice(-6)}`;
    await signedInVet.getByLabel(/Titolo/i).fill(titolo);
    await signedInVet.getByLabel(/Data scadenza/i).fill("2026-09-01");
    await signedInVet.getByRole("button", { name: /^Salva$/i }).click();

    await expect(signedInVet.getByText(titolo)).toBeVisible({ timeout: 15_000 });

    const openBox = () =>
      signedInVet.getByRole("checkbox", { name: /segna come fatto/i }).first();
    const doneBox = () =>
      signedInVet.getByRole("checkbox", { name: /segna come da fare/i }).first();

    await openBox().click();
    await expect(doneBox()).toBeVisible({ timeout: 10_000 });
    await expect(doneBox()).toBeChecked();

    await doneBox().click();
    await expect(openBox()).toBeVisible({ timeout: 10_000 });
    await expect(openBox()).not.toBeChecked();

    await signedInVet.reload();
    await expect(
      signedInVet.getByRole("heading", { level: 1, name: /Promemoria/i })
    ).toBeVisible({ timeout: 15_000 });
    await expect(signedInVet.getByText(titolo)).toBeVisible({ timeout: 15_000 });

    const reloadedBox = signedInVet
      .getByRole("checkbox", { name: /segna come fatto/i })
      .first();
    await expect(reloadedBox).toBeVisible({ timeout: 10_000 });
    await expect(reloadedBox).not.toBeChecked();

    await expect(signedInVet.getByText(/Caricamento fallito/i)).toHaveCount(0);

    const fatalErrors = consoleErrors.filter((e) =>
      /TypeError|Cannot read|undefined is not|ZodError|invalid_type/i.test(e)
    );
    expect(fatalErrors, fatalErrors.join("\n")).toEqual([]);
  });

  test("agenda: week navigation works and a seeded activity shows in the current week", async ({
    signedInVet,
  }) => {
    const today = noonToday();
    await seedAttivitaAt(today, { id: "e2e-agenda-today", tariffa: 99 });

    await signedInVet.goto("/agenda");
    await expect(
      signedInVet.getByRole("heading", { level: 1, name: /Agenda/i })
    ).toBeVisible({ timeout: 15_000 });

    await expect(
      signedInVet.getByText(FIXTURE.azienda.nome).first()
    ).toBeVisible({ timeout: 10_000 });

    await navigateAgendaWeek(signedInVet, "next");
    await navigateAgendaWeek(signedInVet, "prev");

    await expect(
      signedInVet.getByRole("heading", { level: 1, name: /Agenda/i })
    ).toBeVisible();
    await expect(
      signedInVet.getByText(FIXTURE.azienda.nome).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("riepilogo pro-forma renders a valid non-empty PDF", async ({
    signedInVet,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", DOWNLOAD_ONLY_CHROMIUM);
    await signedInVet.goto(
      `/aziende/${FIXTURE.azienda.id}/riepilogo?from=2026-05-01&to=2026-05-31`
    );
    await expect(
      signedInVet.getByRole("heading", {
        level: 1,
        name: /Riepilogo prestazioni/i,
      })
    ).toBeVisible({ timeout: 15_000 });
    await expect(signedInVet.getByText(FIXTURE.tipo.nome).first()).toBeVisible({
      timeout: 10_000,
    });

    const dl = signedInVet.waitForEvent("download", { timeout: 25_000 });
    await signedInVet.getByRole("button", { name: /Stampa o salva PDF/i }).click();
    const download = await dl;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);

    const bytes = await readDownloadBytes(download);
    expect(bytes.byteLength).toBeGreaterThan(1000);
    expect(isPdf(bytes), "riepilogo download is a PDF").toBe(true);
  });

  test("conti: vet pro-forma emits a valid PDF (BOZZA watermark is visual)", async ({
    signedInVet,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", DOWNLOAD_ONLY_CHROMIUM);
    await openContoForMay(signedInVet);
    const proformaDl = signedInVet.waitForEvent("download", { timeout: 25_000 });
    await signedInVet
      .getByRole("button", { name: /Salva come pro forma/i })
      .click();
    const proforma = await proformaDl;
    expect(proforma.suggestedFilename()).toMatch(/\.pdf$/);
    const proformaBytes = await readDownloadBytes(proforma);
    expect(proformaBytes.byteLength).toBeGreaterThan(1000);
    expect(isPdf(proformaBytes), "proforma is a PDF").toBe(true);
    await expect(signedInVet.getByText(/Pro forma generato/i)).toBeVisible({
      timeout: 15_000,
    });
  });

  test("conti: admin final conto emits a valid PDF", async ({
    signedInAdmin,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", DOWNLOAD_ONLY_CHROMIUM);
    await openContoForMay(signedInAdmin);
    const contoDl = signedInAdmin.waitForEvent("download", { timeout: 25_000 });
    await signedInAdmin.getByRole("button", { name: /^Emetti conto$/i }).click();
    await signedInAdmin
      .getByRole("dialog")
      .getByRole("button", { name: /^Emetti$/i })
      .click();
    const conto = await contoDl;
    expect(conto.suggestedFilename()).toMatch(/\.pdf$/);
    const contoBytes = await readDownloadBytes(conto);
    expect(contoBytes.byteLength).toBeGreaterThan(1000);
    expect(isPdf(contoBytes), "final conto is a PDF").toBe(true);
    await expect(signedInAdmin.getByText(/Conto emesso/i)).toBeVisible({
      timeout: 15_000,
    });
  });
});

async function navigateAgendaWeek(
  page: Page,
  direction: "next" | "prev"
): Promise<void> {
  const label =
    direction === "next" ? /Settimana successiva/i : /Settimana precedente/i;
  await page.getByRole("button", { name: label }).first().click();
}

async function openContoForMay(page: Page): Promise<void> {
  await page.goto(`/aziende/${FIXTURE.azienda.id}`);
  await expect(
    page.getByRole("heading", { level: 1, name: FIXTURE.azienda.nome })
  ).toBeVisible({ timeout: 15_000 });

  await page.getByRole("tab", { name: /Personalizzato/i }).click();
  await page.getByLabel(/^Da$/i).fill("2026-05-01");
  await page.getByLabel(/^A$/i).fill("2026-05-31");

  await expect(page.getByText(/Attività:\s*1/)).toBeVisible({ timeout: 10_000 });
}

async function selectAllInCestino(page: Page): Promise<void> {
  const toolbar = page.getByRole("toolbar", { name: /Azioni cestino/i });
  await expect(toolbar).toBeVisible({ timeout: 10_000 });
  await toolbar.getByRole("checkbox").first().click();
}
