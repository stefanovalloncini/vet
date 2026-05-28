import { expect, test } from "./setup/auth";
import { FIXTURE, restoreSeededFixture } from "./setup/seed";

test.describe("reminders list UI", () => {
  test.beforeEach(async () => {
    await restoreSeededFixture();
  });

  test("shows one heading and the empty state", async ({ signedInVet }) => {
    await signedInVet.goto("/promemoria");
    await expect(
      signedInVet.getByRole("heading", { level: 1, name: /Promemoria/i })
    ).toBeVisible({ timeout: 15_000 });
    await expect(signedInVet.getByText(/Nessun promemoria\./i)).toBeVisible({
      timeout: 10_000,
    });
  });

  test("renders a created reminder with an action checkbox and due date", async ({
    signedInVet,
  }) => {
    await signedInVet.goto("/promemoria");
    await expect(
      signedInVet.getByRole("heading", { level: 1 })
    ).toBeVisible({ timeout: 15_000 });

    await signedInVet
      .getByRole("button", { name: /Nuovo promemoria/i })
      .click();
    await signedInVet
      .getByLabel(/Azienda/i, { exact: false })
      .selectOption(FIXTURE.azienda.id);
    const unique = `Controllo ${Date.now().toString().slice(-6)}`;
    await signedInVet.getByLabel(/Titolo/i).fill(unique);
    await signedInVet.getByLabel(/Data scadenza/i).fill("2026-09-01");
    await signedInVet.getByRole("button", { name: /^Salva$/i }).click();

    await expect(signedInVet.getByText(unique)).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      signedInVet.getByRole("checkbox", { name: /segna come fatto/i }).first()
    ).toBeVisible();
    await expect(
      signedInVet.getByText(new RegExp(FIXTURE.azienda.nome)).first()
    ).toBeVisible();
  });
});
