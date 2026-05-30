import { expect, test } from "./setup/auth";
import { FIXTURE, restoreSeededFixture } from "./setup/seed";

test.describe("attivita form (RHF)", () => {
  test.beforeEach(async () => {
    await restoreSeededFixture();
  });

  test("creates a new attivita via the migrated form", async ({
    signedInVet,
  }) => {
    const tariffaMarker = 200 + (Date.now() % 700);
    await signedInVet.goto("/attivita/nuova");
    await expect(signedInVet.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 15_000,
    });

    await signedInVet.getByLabel(/Data/i).fill("2026-05-22");
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
    await expect(
      signedInVet
        .getByText(new RegExp(`${tariffaMarker}[,.]00`))
        .filter({ visible: true })
        .first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("accepts a float-fragile 2-decimal tariffa (regression: 19.99 was wrongly rejected)", async ({
    signedInVet,
  }) => {
    await signedInVet.goto("/attivita/nuova");
    await expect(signedInVet.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 15_000,
    });

    await signedInVet.getByLabel(/Data/i).fill("2026-05-23");
    await signedInVet
      .getByLabel(/Azienda/i, { exact: false })
      .selectOption(FIXTURE.azienda.id);
    await signedInVet
      .getByLabel(/Tipo/i, { exact: false })
      .first()
      .selectOption(FIXTURE.tipo.id);
    await signedInVet.getByLabel(/Tariffa/i).fill("19.99");

    await signedInVet.getByRole("button", { name: /^Salva$/i }).click();

    await expect(signedInVet).toHaveURL(/\/attivita(\?|$)/, { timeout: 15_000 });
    await expect(
      signedInVet.getByText(/19[,.]99/).filter({ visible: true }).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("surfaces validation errors when required fields are missing", async ({
    signedInVet,
  }) => {
    await signedInVet.goto("/attivita/nuova");
    await expect(signedInVet.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 15_000,
    });

    await signedInVet.getByLabel(/Azienda/i, { exact: false }).selectOption("");
    await signedInVet
      .getByLabel(/Tipo/i, { exact: false })
      .first()
      .selectOption("");
    await signedInVet.getByLabel(/Tariffa/i).fill("");

    await signedInVet.getByRole("button", { name: /^Salva$/i }).click();

    await expect(signedInVet.getByText(/Scegli un'azienda/i)).toBeVisible({
      timeout: 5_000,
    });
    await expect(signedInVet.getByText(/Scegli un tipo/i)).toBeVisible();
    await expect(signedInVet.getByText(/Tariffa obbligatoria/i)).toBeVisible();
    await expect(signedInVet).toHaveURL(/\/attivita\/nuova/);
  });
});
