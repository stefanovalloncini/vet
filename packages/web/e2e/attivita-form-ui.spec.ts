import { expect, test } from "./setup/auth";
import { FIXTURE, restoreSeededFixture } from "./setup/seed";

test.describe("attivita form UI", () => {
  test.beforeEach(async () => {
    await restoreSeededFixture();
  });

  test("reveals the ore field only after choosing hourly payment", async ({
    signedInVet,
  }) => {
    await signedInVet.goto("/attivita/nuova");
    await expect(
      signedInVet.getByRole("button", { name: /^Salva$/i })
    ).toBeVisible({ timeout: 15_000 });

    await expect(signedInVet.getByLabel("Ore", { exact: true })).toHaveCount(0);
    await signedInVet.getByLabel("Pagamento orario").check();
    await expect(
      signedInVet.getByLabel("Ore", { exact: true })
    ).toBeVisible();
  });

  test("accepts a low tariffa and saves the attivita", async ({
    signedInVet,
  }) => {
    const tariffaMarker = 1 + (Date.now() % 9);
    await signedInVet.goto("/attivita/nuova");
    await expect(
      signedInVet.getByRole("button", { name: /^Salva$/i })
    ).toBeVisible({ timeout: 15_000 });

    await signedInVet.getByLabel(/Data/i).fill("2026-05-23");
    await signedInVet
      .getByLabel(/Azienda/i, { exact: false })
      .selectOption(FIXTURE.azienda.id);
    await signedInVet
      .getByLabel(/Tipo/i, { exact: false })
      .first()
      .selectOption(FIXTURE.tipo.id);
    await signedInVet.getByLabel(/Tariffa/i).fill(String(tariffaMarker));

    await signedInVet.getByRole("button", { name: /^Salva$/i }).click();
    await expect(signedInVet).toHaveURL(/\/attivita(\?|$)/, { timeout: 15_000 });
  });

  test("shows the live total once a tariffa is entered", async ({
    signedInVet,
  }) => {
    await signedInVet.goto("/attivita/nuova");
    await expect(
      signedInVet.getByRole("button", { name: /^Salva$/i })
    ).toBeVisible({ timeout: 15_000 });

    await signedInVet
      .getByLabel(/Azienda/i, { exact: false })
      .selectOption(FIXTURE.azienda.id);
    await signedInVet
      .getByLabel(/Tipo/i, { exact: false })
      .first()
      .selectOption(FIXTURE.tipo.id);
    await signedInVet.getByLabel(/Tariffa/i).fill("90");

    await expect(signedInVet.getByText(/90,00/)).toBeVisible({ timeout: 10_000 });
  });
});
