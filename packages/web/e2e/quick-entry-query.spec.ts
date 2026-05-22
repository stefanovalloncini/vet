import { expect, test } from "./setup/auth";
import { FIXTURE } from "./setup/seed";

test.describe("quick entry (tanstack query)", () => {
  test("vet creates an attivita via the fab and undoes it via the toast", async ({
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

    await signedInVet.getByLabel(/Data/i).fill("2026-05-28");
    await signedInVet
      .getByLabel(/Azienda/i, { exact: false })
      .selectOption(FIXTURE.azienda.id);
    await signedInVet
      .getByLabel(/Tipo/i, { exact: false })
      .first()
      .selectOption(FIXTURE.tipo.id);
    await signedInVet.getByLabel(/Tariffa/i).fill("120");

    await signedInVet.getByRole("button", { name: /^Salva$/i }).click();

    await expect(
      signedInVet.getByText(/Attività salvata/i)
    ).toBeVisible({ timeout: 10_000 });

    await signedInVet.getByRole("button", { name: /Annulla/i }).click();

    await expect(
      signedInVet.getByText(/Attività annullata/i)
    ).toBeVisible({ timeout: 10_000 });
  });
});
