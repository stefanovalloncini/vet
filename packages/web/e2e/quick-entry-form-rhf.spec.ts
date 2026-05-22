import { expect, test } from "./setup/auth";
import { FIXTURE } from "./setup/seed";

test.describe("quick entry dialog (react hook form)", () => {
  test("vet saves a new attivita via the FAB and form clears on close", async ({
    signedInVet,
  }) => {
    await signedInVet.goto("/attivita");
    await expect(signedInVet.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 15_000,
    });

    await signedInVet.getByRole("button", { name: /Voce rapida/i }).click();
    await expect(
      signedInVet.getByRole("heading", { name: /Voce rapida/i })
    ).toBeVisible({ timeout: 10_000 });

    await signedInVet.getByLabel(/Data/i).fill("2026-05-29");
    await signedInVet
      .getByLabel(/Azienda/i, { exact: false })
      .selectOption(FIXTURE.azienda.id);
    await signedInVet
      .getByLabel(/Tipo/i, { exact: false })
      .first()
      .selectOption(FIXTURE.tipo.id);
    await signedInVet.getByLabel(/Tariffa/i).fill("90");

    await signedInVet.getByRole("button", { name: /^Salva$/i }).click();

    await expect(
      signedInVet.getByText(/Attività salvata/i)
    ).toBeVisible({ timeout: 10_000 });
  });

  test("vet sees field error on empty submit", async ({ signedInVet }) => {
    await signedInVet.goto("/attivita");
    await expect(signedInVet.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 15_000,
    });

    await signedInVet.getByRole("button", { name: /Voce rapida/i }).click();
    await expect(
      signedInVet.getByRole("heading", { name: /Voce rapida/i })
    ).toBeVisible({ timeout: 10_000 });

    await signedInVet.getByRole("button", { name: /^Salva$/i }).click();

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

    await signedInVet.getByRole("button", { name: /Voce rapida/i }).click();
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
