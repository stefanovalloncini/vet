import { expect, test } from "./setup/auth";
import { FIXTURE } from "./setup/seed";

test.describe("reminders page (tanstack query)", () => {
  test("vet sees the empty reminders state", async ({ signedInVet }) => {
    await signedInVet.goto("/promemoria");
    await expect(signedInVet.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      signedInVet.getByRole("button", { name: /Nuovo promemoria/i })
    ).toBeVisible({ timeout: 10_000 });
  });

  test("vet creates a reminder and sees it in the list", async ({
    signedInVet,
  }) => {
    await signedInVet.goto("/promemoria");
    await expect(signedInVet.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 15_000,
    });

    await signedInVet
      .getByRole("button", { name: /Nuovo promemoria/i })
      .click();
    await signedInVet
      .getByLabel(/Azienda/i, { exact: false })
      .selectOption(FIXTURE.azienda.id);
    const unique = `Richiamo ${Date.now().toString().slice(-6)}`;
    await signedInVet.getByLabel(/Titolo/i).fill(unique);
    await signedInVet.getByLabel(/Data scadenza/i).fill("2026-09-01");
    await signedInVet.getByRole("button", { name: /^Salva$/i }).click();

    await expect(signedInVet.getByText(unique)).toBeVisible({
      timeout: 15_000,
    });
  });
});
