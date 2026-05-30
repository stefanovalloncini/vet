import type { Page } from "@playwright/test";
import { expect, test } from "../setup/auth";
import { restoreSeededFixture } from "../setup/seed";
import {
  countAttivita,
  countAziende,
  findAttivitaByTipo,
  listAttivita,
  seedAzienda,
  seedRawAttivita,
  seedTipo,
} from "./entryModesHelpers";

const GIN = "ginecologia";
const ALTRO = "altro";
const ORARIO = "ecografie-polmonari";
const PER_ELEMENTO = "campioni-sangue";
const FISSO = "visita-fissa";

const AZIENDA_A = { id: "e2e-azienda-a", nome: "Stalla Rossi" };
const AZIENDA_B = { id: "e2e-azienda-b", nome: "Cascina Gialli" };

async function seedReferenceData(): Promise<void> {
  await Promise.all([
    seedTipo({ id: GIN, nome: "Ginecologia", ordine: 1 }),
    seedTipo({ id: ALTRO, nome: "Altro", ordine: 999 }),
    seedTipo({
      id: ORARIO,
      nome: "Ecografie polmonari",
      ordine: 5,
      modalitaDefault: "oraria",
    }),
    seedTipo({
      id: PER_ELEMENTO,
      nome: "Campioni sangue",
      ordine: 2,
      modalitaDefault: "adElemento",
    }),
    seedTipo({
      id: FISSO,
      nome: "Visita fissa",
      ordine: 3,
      modalitaDefault: "fissa",
    }),
    seedAzienda(AZIENDA_A),
    seedAzienda(AZIENDA_B),
  ]);
}

async function gotoAttivita(page: Page) {
  await page.goto("/attivita");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
    timeout: 20_000,
  });
}

async function openQuickEntry(page: Page) {
  const dialog = page.getByRole("dialog", { name: /Voce rapida/i });
  const seededOption = dialog.getByRole("option", { name: AZIENDA_A.nome });
  // The quick-entry dialog renders the full azienda select on every viewport.
  // Gate on a seeded option there (not the responsive filter bar). On the first
  // post-sign-in navigation the reference-data query can resolve empty; reload
  // and reopen until the seeded option is present, then drive the form.
  for (let attempt = 0; attempt < 4; attempt++) {
    await gotoAttivita(page);
    await page.keyboard.press("n");
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    if (await seededOption.count()) break;
    await expect(seededOption)
      .toBeAttached({ timeout: 5_000 })
      .catch(() => undefined);
    if (await seededOption.count()) break;
  }
  await expect(seededOption).toBeAttached({ timeout: 10_000 });
  return dialog;
}

function dialogOf(page: Page) {
  return page.getByRole("dialog", { name: /Voce rapida/i });
}

test.describe("entry modes + money integrity", () => {
  test.beforeEach(async ({}, testInfo) => {
    testInfo.setTimeout(testInfo.timeout + 60_000);
    await restoreSeededFixture();
    await seedReferenceData();
  });

  test("fixed / oraria / ad-elemento totals are the exact product, no float drift", async ({
    signedInVet,
  }) => {
    const before = await countAttivita();

    // FIXED rate, "unlucky" 19.99 (must be accepted, not rejected as >2 decimals)
    const fixed = await openQuickEntry(signedInVet);
    await fixed.getByLabel("Data", { exact: true }).fill("2026-05-20");
    await fixed.getByLabel("Azienda", { exact: true }).selectOption(AZIENDA_A.id);
    await fixed.getByLabel("Tipo", { exact: true }).selectOption(FISSO);
    await fixed.getByRole("radio", { name: "Fissa" }).click();
    await fixed.getByRole("spinbutton", { name: /Tariffa/i }).fill("19.99");
    await expect(fixed.getByText(/19,99\s*€/)).toBeVisible();
    await fixed.getByRole("button", { name: /^Salva$/i }).click();
    await expect(signedInVet.getByText(/Attività salvata/i)).toBeVisible({
      timeout: 10_000,
    });

    // ORARIA 33.33 x 3 = 99.99 (JS: 33.33*3 === 99.99000000000001)
    const oraria = await openQuickEntry(signedInVet);
    await oraria.getByLabel("Data", { exact: true }).fill("2026-05-20");
    await oraria
      .getByLabel("Azienda", { exact: true })
      .selectOption(AZIENDA_A.id);
    await oraria.getByLabel("Tipo", { exact: true }).selectOption(ORARIO);
    await expect(oraria.getByRole("radio", { name: "Oraria" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    await oraria.getByRole("spinbutton", { name: /Tariffa/i }).fill("33.33");
    await oraria.getByRole("spinbutton", { name: /^Ore$/i }).fill("3");
    // NB: the quick-entry dialog's live "Totale" shows only the rate, not
    // rate x ore. The stored total (asserted below) is the true product.
    await oraria.getByRole("button", { name: /^Salva$/i }).click();
    await expect(signedInVet.getByText(/Attività salvata/i)).toBeVisible({
      timeout: 10_000,
    });

    // AD-ELEMENTO 19.99 x 3 = 59.97 (JS: 19.99*3 === 59.96999999999999)
    const adEl = await openQuickEntry(signedInVet);
    await adEl.getByLabel("Data", { exact: true }).fill("2026-05-20");
    await adEl.getByLabel("Azienda", { exact: true }).selectOption(AZIENDA_A.id);
    await adEl.getByLabel("Tipo", { exact: true }).selectOption(PER_ELEMENTO);
    await expect(
      adEl.getByRole("radio", { name: "Ad elemento" })
    ).toHaveAttribute("aria-checked", "true");
    await adEl.getByRole("spinbutton", { name: /Tariffa/i }).fill("19.99");
    await adEl.getByRole("spinbutton", { name: /Quantità/i }).fill("3");
    await adEl.getByRole("button", { name: /^Salva$/i }).click();
    await expect(signedInVet.getByText(/Attività salvata/i)).toBeVisible({
      timeout: 10_000,
    });

    await expect.poll(() => countAttivita()).toBe(before + 3);

    const [fixedDoc] = await findAttivitaByTipo(FISSO);
    const [orarioDoc] = await findAttivitaByTipo(ORARIO);
    const [elDoc] = await findAttivitaByTipo(PER_ELEMENTO);

    expect(fixedDoc).toBeDefined();
    expect(fixedDoc?.tariffa).toBe(19.99);
    expect(fixedDoc?.totale).toBe(19.99);

    expect(orarioDoc).toBeDefined();
    expect(orarioDoc?.tariffa).toBe(33.33);
    expect(orarioDoc?.ore).toBe(3);
    // The exact product, free of IEEE-754 drift.
    expect(orarioDoc?.totale).toBe(99.99);
    expect(orarioDoc?.totale).not.toBe(99.99000000000001);

    expect(elDoc).toBeDefined();
    expect(elDoc?.tariffa).toBe(19.99);
    expect(elDoc?.elementi).toBe(3);
    expect(elDoc?.totale).toBe(59.97);
    expect(elDoc?.totale).not.toBe(59.96999999999999);

    // Every stored total has at most two decimals.
    for (const doc of await listAttivita()) {
      expect(Number(doc.totale.toFixed(2))).toBe(doc.totale);
    }
  });

  test("0.1 x 3 ad-elemento rounds to 0.30 without binary-fraction drift", async ({
    signedInVet,
  }) => {
    const dialog = await openQuickEntry(signedInVet);
    await dialog.getByLabel("Data", { exact: true }).fill("2026-05-21");
    await dialog
      .getByLabel("Azienda", { exact: true })
      .selectOption(AZIENDA_A.id);
    await dialog.getByLabel("Tipo", { exact: true }).selectOption(PER_ELEMENTO);
    await dialog.getByRole("spinbutton", { name: /Tariffa/i }).fill("0.1");
    await dialog.getByRole("spinbutton", { name: /Quantità/i }).fill("3");
    await dialog.getByRole("button", { name: /^Salva$/i }).click();
    await expect(signedInVet.getByText(/Attività salvata/i)).toBeVisible({
      timeout: 10_000,
    });

    const docs = await findAttivitaByTipo(PER_ELEMENTO);
    const doc = docs.find((d) => d.tariffa === 0.1);
    expect(doc).toBeDefined();
    expect(doc?.elementi).toBe(3);
    // 0.1 * 3 === 0.30000000000000004 in IEEE-754; the app must store 0.3.
    expect(doc?.totale).toBe(0.3);
    expect(doc?.totale).not.toBe(0.30000000000000004);
  });

  test("tariffa with more than two decimals is rejected, never saved", async ({
    signedInVet,
  }) => {
    const before = await countAttivita();
    const dialog = await openQuickEntry(signedInVet);
    await dialog.getByLabel("Data", { exact: true }).fill("2026-05-22");
    await dialog
      .getByLabel("Azienda", { exact: true })
      .selectOption(AZIENDA_A.id);
    await dialog.getByLabel("Tipo", { exact: true }).selectOption(FISSO);
    await dialog.getByRole("spinbutton", { name: /Tariffa/i }).fill("19.999");
    await dialog.getByRole("button", { name: /^Salva$/i }).click();

    await expect(dialog.getByText(/Tariffa non valida/i)).toBeVisible({
      timeout: 5_000,
    });
    await expect(signedInVet.getByText(/Attività salvata/i)).toHaveCount(0);
    await expect.poll(() => countAttivita()).toBe(before);
  });

  test("ginecologia tariffa memory is per-azienda, not cross-contaminated", async ({
    signedInVet,
  }) => {
    // Azienda A's last ginecologia was 45.50; Azienda B's was 60.00.
    await seedRawAttivita({
      id: "gin-a-old",
      data: new Date("2026-04-10T08:00:00.000Z"),
      aziendaId: AZIENDA_A.id,
      aziendaNome: AZIENDA_A.nome,
      tipoId: GIN,
      tipoNome: "Ginecologia",
      tariffa: 45.5,
      totale: 45.5,
    });
    await seedRawAttivita({
      id: "gin-b-old",
      data: new Date("2026-04-12T08:00:00.000Z"),
      aziendaId: AZIENDA_B.id,
      aziendaNome: AZIENDA_B.nome,
      tipoId: GIN,
      tipoNome: "Ginecologia",
      tariffa: 60,
      totale: 60,
    });

    // Open a fresh ginecologia for B first -> should prefill 60.00.
    const forB = await openQuickEntry(signedInVet);
    await forB.getByLabel("Azienda", { exact: true }).selectOption(AZIENDA_B.id);
    await forB.getByLabel("Tipo", { exact: true }).selectOption(GIN);
    await expect(forB.getByRole("spinbutton", { name: /Tariffa/i })).toHaveValue(
      "60",
      { timeout: 10_000 }
    );
    await signedInVet.keyboard.press("Escape");
    await expect(dialogOf(signedInVet)).toBeHidden({ timeout: 10_000 });

    // Now A -> must prefill A's 45.50, never B's 60.00.
    const forA = await openQuickEntry(signedInVet);
    await forA.getByLabel("Azienda", { exact: true }).selectOption(AZIENDA_A.id);
    await forA.getByLabel("Tipo", { exact: true }).selectOption(GIN);
    await expect(forA.getByRole("spinbutton", { name: /Tariffa/i })).toHaveValue(
      "45.5",
      { timeout: 10_000 }
    );
    await expect(
      forA.getByRole("spinbutton", { name: /Tariffa/i })
    ).not.toHaveValue("60");
  });

  test("Altro requires a note: field-level error, then succeeds with a note", async ({
    signedInVet,
  }) => {
    const before = await countAttivita();
    const dialog = await openQuickEntry(signedInVet);
    await dialog.getByLabel("Data", { exact: true }).fill("2026-05-23");
    await dialog
      .getByLabel("Azienda", { exact: true })
      .selectOption(AZIENDA_A.id);
    await dialog.getByLabel("Tipo", { exact: true }).selectOption(ALTRO);
    await dialog.getByRole("spinbutton", { name: /Tariffa/i }).fill("40");

    // Empty note -> field-level validation error on the note field.
    await dialog.getByRole("button", { name: /^Salva$/i }).click();
    await expect(
      dialog.getByText(/La nota è obbligatoria per il tipo Altro/i)
    ).toBeVisible({ timeout: 5_000 });
    await expect.poll(() => countAttivita()).toBe(before);

    // Provide a note -> saves.
    await dialog.getByLabel(/Note/i).fill("Castrazione gattino");
    await dialog.getByRole("button", { name: /^Salva$/i }).click();
    await expect(signedInVet.getByText(/Attività salvata/i)).toBeVisible({
      timeout: 10_000,
    });

    const docs = await findAttivitaByTipo(ALTRO);
    expect(docs).toHaveLength(1);
    expect(docs[0]?.note).toBe("Castrazione gattino");
    expect(docs[0]?.totale).toBe(40);
  });

  test("boundary caps: ore=24 accepted at the cap, ore>24 rejected", async ({
    signedInVet,
  }) => {
    const before = await countAttivita();

    // ore = 24 exactly, tariffa = 100000 -> totale 2_400_000 (the documented max).
    const ok = await openQuickEntry(signedInVet);
    await ok.getByLabel("Data", { exact: true }).fill("2026-05-24");
    await ok.getByLabel("Azienda", { exact: true }).selectOption(AZIENDA_A.id);
    await ok.getByLabel("Tipo", { exact: true }).selectOption(ORARIO);
    await ok.getByRole("spinbutton", { name: /Tariffa/i }).fill("100000");
    await ok.getByRole("spinbutton", { name: /^Ore$/i }).fill("24");
    await ok.getByRole("button", { name: /^Salva$/i }).click();
    await expect(signedInVet.getByText(/Attività salvata/i)).toBeVisible({
      timeout: 10_000,
    });

    await expect.poll(() => countAttivita()).toBe(before + 1);
    const [maxDoc] = await findAttivitaByTipo(ORARIO);
    expect(maxDoc?.totale).toBe(2_400_000);

    // ore = 25 -> over the 24h cap, must be refused (no new doc).
    const bad = await openQuickEntry(signedInVet);
    await bad.getByLabel("Data", { exact: true }).fill("2026-05-25");
    await bad.getByLabel("Azienda", { exact: true }).selectOption(AZIENDA_B.id);
    await bad.getByLabel("Tipo", { exact: true }).selectOption(ORARIO);
    await bad.getByRole("spinbutton", { name: /Tariffa/i }).fill("100");
    await bad.getByRole("spinbutton", { name: /^Ore$/i }).fill("25");
    await bad.getByRole("button", { name: /^Salva$/i }).click();

    await expect(bad.getByText(/Dati non validi/i)).toBeVisible({
      timeout: 5_000,
    });
    await expect.poll(() => countAttivita()).toBe(before + 1);
  });

  test("tariffa above the 100000 cap is rejected", async ({ signedInVet }) => {
    const before = await countAttivita();
    const dialog = await openQuickEntry(signedInVet);
    await dialog.getByLabel("Data", { exact: true }).fill("2026-05-26");
    await dialog
      .getByLabel("Azienda", { exact: true })
      .selectOption(AZIENDA_A.id);
    await dialog.getByLabel("Tipo", { exact: true }).selectOption(FISSO);
    await dialog
      .getByRole("spinbutton", { name: /Tariffa/i })
      .fill("100000.01");
    await dialog.getByRole("button", { name: /^Salva$/i }).click();

    await expect(dialog.getByText(/Tariffa non valida/i)).toBeVisible({
      timeout: 5_000,
    });
    await expect.poll(() => countAttivita()).toBe(before);
  });

  test("CSV export is Italian-Excel shaped and round-trips a comma decimal", async ({
    signedInVet,
  }) => {
    // A known activity with a comma-decimal total to assert round-trip.
    await seedRawAttivita({
      id: "csv-money",
      data: new Date("2026-05-15T08:00:00.000Z"),
      aziendaId: AZIENDA_A.id,
      aziendaNome: AZIENDA_A.nome,
      tipoId: FISSO,
      tipoNome: "Visita fissa",
      tariffa: 19.99,
      totale: 19.99,
    });

    await signedInVet.goto("/attivita");
    await expect(signedInVet.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 15_000,
    });
    await signedInVet
      .getByRole("button", { name: "Esporta CSV" })
      .first()
      .click();
    await expect(
      signedInVet.getByRole("heading", { name: "Esporta in CSV" })
    ).toBeVisible({ timeout: 10_000 });

    const downloadPromise = signedInVet.waitForEvent("download");
    await signedInVet.getByRole("button", { name: /^Scarica$/i }).click();
    const download = await downloadPromise;
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const c of stream) chunks.push(c as Buffer);
    const raw = Buffer.concat(chunks);
    const text = raw.toString("utf8");

    // UTF-8 BOM (EF BB BF), the bytes Italian Excel needs to read accents.
    expect(raw[0]).toBe(0xef);
    expect(raw[1]).toBe(0xbb);
    expect(raw[2]).toBe(0xbf);
    expect(text.charCodeAt(0)).toBe(0xfeff);

    // ';' field separator, '\r\n' line endings.
    const body = text.slice(1);
    const lines = body.split("\r\n").filter((l) => l.length > 0);
    expect(lines.length).toBeGreaterThanOrEqual(2);
    const header = lines[0]?.split(";") ?? [];
    expect(header).toContain("Totale");
    expect(header).toContain("Tariffa");
    expect(text).toContain("\r\n");

    // Comma decimal: 19.99 is rendered "19,99" and round-trips back to 19.99.
    expect(text).toContain("19,99");
    const moneyRow = lines.find((l) => l.includes(AZIENDA_A.nome));
    expect(moneyRow).toBeDefined();
    const cells = (moneyRow ?? "").split(";");
    const totaleIdx = header.indexOf("Totale");
    const totaleCell = cells[totaleIdx] ?? "";
    expect(totaleCell).toBe("19,99");
    expect(Number(totaleCell.replace(",", "."))).toBe(19.99);
  });

  test("CSV neutralizes a formula-injection note (defense in depth)", async ({
    signedInVet,
  }) => {
    // The Firestore rules forbid a '=' leading char on note/aziendaNome, so this
    // value can only land via a non-client writer. Seed it raw to prove the
    // export-side guard still prefixes the cell.
    await seedRawAttivita({
      id: "csv-injection",
      data: new Date("2026-05-16T08:00:00.000Z"),
      aziendaId: AZIENDA_B.id,
      aziendaNome: AZIENDA_B.nome,
      tipoId: FISSO,
      tipoNome: "Visita fissa",
      tariffa: 10,
      totale: 10,
      note: "=SUM(A1:A9)+cmd",
    });

    await signedInVet.goto("/attivita");
    await expect(signedInVet.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 15_000,
    });
    await signedInVet
      .getByRole("button", { name: "Esporta CSV" })
      .first()
      .click();
    await expect(
      signedInVet.getByRole("heading", { name: "Esporta in CSV" })
    ).toBeVisible({ timeout: 10_000 });

    const downloadPromise = signedInVet.waitForEvent("download");
    await signedInVet.getByRole("button", { name: /^Scarica$/i }).click();
    const download = await downloadPromise;
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const c of stream) chunks.push(c as Buffer);
    const text = Buffer.concat(chunks).toString("utf8");

    // The note must be neutralized with a leading apostrophe, never raw '=SUM'.
    expect(text).toContain("'=SUM(A1:A9)+cmd");
    expect(text).not.toMatch(/;=SUM\(A1:A9\)/);
  });

  test("client cannot create an azienda whose name starts with '=' (rules deny)", async ({
    signedInVet,
  }) => {
    // base fixture azienda + AZIENDA_A + AZIENDA_B before the rejected attempt.
    expect(await countAziende()).toBe(3);

    const dialog = await openQuickEntry(signedInVet);
    await dialog.getByRole("button", { name: /\+ Nuova/i }).click();
    await expect(
      signedInVet.getByRole("heading", { name: /Nuova azienda/i })
    ).toBeVisible({ timeout: 5_000 });

    await signedInVet.getByLabel(/^Nome$/i).fill("=SUM(evil)");
    await signedInVet.getByRole("button", { name: /^Crea$/i }).click();

    // The write is denied server-side; the quick-add dialog stays open with an
    // inline error and the formula-named azienda never lands.
    const aziendaDialog = signedInVet.getByRole("dialog", {
      name: /Nuova azienda/i,
    });
    await expect(
      aziendaDialog.getByRole("alert").filter({ hasText: /Salvataggio non riuscito/i })
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      signedInVet.getByRole("heading", { name: /Nuova azienda/i })
    ).toBeVisible();
    expect(await countAziende()).toBe(3);
  });
});
