import { expect, test } from "./setup/auth";
import { FIXTURE, restoreSeededFixture } from "./setup/seed";

test.describe("attivita list UI", () => {
  test.beforeEach(async () => {
    await restoreSeededFixture();
  });

  test("renders one page heading, totals and the seeded row", async ({
    signedInVet,
  }) => {
    await signedInVet.goto("/attivita");
    await expect(
      signedInVet.getByRole("heading", { level: 1, name: /Attività/ })
    ).toBeVisible({ timeout: 15_000 });

    await expect(signedInVet.getByText("Voci")).toBeVisible();
    await expect(signedInVet.getByText("Totale").first()).toBeVisible();
    await expect(
      signedInVet
        .getByRole("link", { name: new RegExp(FIXTURE.azienda.nome) })
        .first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("applies a quick-range chip and clears all filters", async ({
    signedInVet,
  }) => {
    await signedInVet.goto("/attivita");
    await expect(
      signedInVet.getByRole("heading", { level: 1 })
    ).toBeVisible({ timeout: 15_000 });

    const oggi = signedInVet
      .getByRole("button", { name: "Oggi" })
      .first();
    await oggi.click();
    await expect(oggi).toHaveAttribute("aria-pressed", "true");

    const clear = signedInVet
      .getByRole("button", { name: "Pulisci filtri" })
      .first();
    await expect(clear).toBeVisible();
    await clear.click();
    await expect(
      signedInVet.getByRole("button", { name: "Pulisci filtri" })
    ).toHaveCount(0);
  });

  test("filters to an empty result and shows the filtered empty state", async ({
    signedInVet,
  }) => {
    await signedInVet.goto("/attivita");
    await expect(
      signedInVet.getByRole("heading", { level: 1 })
    ).toBeVisible({ timeout: 15_000 });

    await signedInVet.getByLabel("Da", { exact: true }).fill("1900-01-01");
    await signedInVet.getByLabel("A", { exact: true }).fill("1900-01-02");

    await expect(
      signedInVet.getByText("Nessun risultato per i filtri scelti.").first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("groups rows by azienda", async ({ signedInVet }) => {
    await signedInVet.goto("/attivita");
    await expect(
      signedInVet.getByRole("heading", { level: 1 })
    ).toBeVisible({ timeout: 15_000 });

    await signedInVet
      .getByLabel("Raggruppa per")
      .selectOption("azienda");

    await expect(
      signedInVet.getByText(new RegExp(FIXTURE.azienda.nome)).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("opens the export dialog and cancels", async ({ signedInVet }) => {
    await signedInVet.goto("/attivita");
    await expect(
      signedInVet.getByRole("heading", { level: 1 })
    ).toBeVisible({ timeout: 15_000 });

    await signedInVet
      .getByRole("button", { name: "Esporta CSV" })
      .first()
      .click();

    await expect(
      signedInVet.getByRole("heading", { name: "Esporta in CSV" })
    ).toBeVisible({ timeout: 10_000 });

    await signedInVet.getByRole("button", { name: "Annulla" }).click();
    await expect(
      signedInVet.getByRole("heading", { name: "Esporta in CSV" })
    ).toHaveCount(0);
  });
});
