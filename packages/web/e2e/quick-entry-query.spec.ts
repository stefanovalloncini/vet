import { expect, test } from "./setup/auth";
import { FIXTURE, restoreSeededFixture } from "./setup/seed";

test.describe("quick entry (tanstack query)", () => {
  test.beforeEach(async () => {
    await restoreSeededFixture();
  });

  test("vet creates an attivita via the fab and undoes it via the toast", async ({
    signedInVet,
  }) => {
    await signedInVet.goto("/attivita");
    await expect(signedInVet.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 15_000,
    });

    await signedInVet.keyboard.press("n");
    const dialog = signedInVet.getByRole("dialog", { name: /Voce rapida/i });
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    await dialog.getByLabel(/Data/i).fill("2026-05-28");
    await dialog.getByLabel("Azienda", { exact: true }).selectOption(FIXTURE.azienda.id);
    await dialog.getByLabel("Tipo", { exact: true }).selectOption(FIXTURE.tipo.id);
    await dialog.getByRole("spinbutton", { name: /Tariffa/i }).fill("120");

    await dialog.getByRole("button", { name: /^Salva$/i }).click();

    await expect(
      signedInVet.getByText(/Attività salvata/i)
    ).toBeVisible({ timeout: 10_000 });

    await signedInVet.getByRole("button", { name: /Annulla/i }).click();

    await expect(
      signedInVet.getByText(/Attività annullata/i)
    ).toBeVisible({ timeout: 10_000 });
  });
});
