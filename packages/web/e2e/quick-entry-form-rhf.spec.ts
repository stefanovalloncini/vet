import { expect, test } from "./setup/auth";
import { FIXTURE, restoreSeededFixture } from "./setup/seed";

test.describe("quick entry dialog (react hook form)", () => {
  test.beforeEach(async () => {
    await restoreSeededFixture();
  });

  test("vet saves a new attivita via the FAB and form clears on close", async ({
    signedInVet,
  }) => {
    await signedInVet.goto("/attivita");
    await expect(signedInVet.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 15_000,
    });

    await signedInVet.keyboard.press("n");
    const dialog = signedInVet.getByRole("dialog", { name: /Voce rapida/i });
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    await dialog.getByLabel(/Data/i).fill("2026-05-29");
    await dialog.getByLabel("Azienda", { exact: true }).selectOption(FIXTURE.azienda.id);
    await dialog.getByLabel("Tipo", { exact: true }).selectOption(FIXTURE.tipo.id);
    await dialog.getByRole("spinbutton", { name: /Tariffa/i }).fill("90");

    await dialog.getByRole("button", { name: /^Salva$/i }).click();

    await expect(
      signedInVet.getByText(/Attività salvata/i)
    ).toBeVisible({ timeout: 10_000 });
  });

  test("vet sees field error on empty submit", async ({ signedInVet }) => {
    await signedInVet.goto("/attivita");
    await expect(signedInVet.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 15_000,
    });

    await signedInVet.keyboard.press("n");
    const dialog = signedInVet.getByRole("dialog", { name: /Voce rapida/i });
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    await dialog.getByRole("button", { name: /^Salva$/i }).click();

    await expect(
      signedInVet.getByText(/Scegli un'azienda/i)
    ).toBeVisible({ timeout: 5_000 });
  });

  test("vet can quick-add a new azienda from inside the form", async ({
    signedInVet,
  }) => {
    await signedInVet.goto("/attivita");
    await expect(signedInVet.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 15_000,
    });

    await signedInVet.keyboard.press("n");
    await expect(
      signedInVet.getByRole("heading", { name: /Voce rapida/i })
    ).toBeVisible({ timeout: 10_000 });

    await signedInVet.getByRole("button", { name: /\+ Nuova/i }).click();
    await expect(
      signedInVet.getByRole("heading", { name: /Nuova azienda/i })
    ).toBeVisible({ timeout: 5_000 });

    const nomeField = signedInVet.getByLabel(/^Nome$/i);
    await nomeField.fill("Allevamento Verdi");
    await signedInVet.getByRole("button", { name: /^Crea$/i }).click();

    await expect(
      signedInVet.getByRole("heading", { name: /Nuova azienda/i })
    ).toBeHidden({ timeout: 10_000 });
  });
});
