import { expect, test } from "./setup/auth";
import { FIXTURE, restoreSeededFixture } from "./setup/seed";

test.describe("/pagamenti page", () => {
  test.beforeEach(async () => {
    await restoreSeededFixture();
  });

  test("renders the heading and the empty state when no conti exist", async ({
    signedInAdmin,
  }) => {
    await signedInAdmin.goto("/pagamenti");
    await expect(
      signedInAdmin.getByRole("heading", { level: 1, name: /Pagamenti/i })
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      signedInAdmin.getByText(/Nessun risultato/i)
    ).toBeVisible({ timeout: 10_000 });
  });

  test("the stato filter is labelled and selectable", async ({
    signedInAdmin,
  }) => {
    // Emit a conto so the grid has at least one row + the filter renders.
    await signedInAdmin.goto(`/aziende/${FIXTURE.azienda.id}`);
    await expect(
      signedInAdmin.getByRole("heading", {
        level: 1,
        name: FIXTURE.azienda.nome,
      })
    ).toBeVisible({ timeout: 15_000 });
    const fromInput = signedInAdmin.locator('input[type="date"]').first();
    const toInput = signedInAdmin.locator('input[type="date"]').nth(1);
    await fromInput.fill("2026-05-01");
    await toInput.fill("2026-05-31");
    await signedInAdmin
      .getByRole("button", { name: /^Emetti conto$/i })
      .click();
    await signedInAdmin.getByRole("button", { name: /^Emetti$/i }).click();
    await expect(
      signedInAdmin.getByText(/Conto emesso/i)
    ).toBeVisible({ timeout: 10_000 });

    await signedInAdmin.goto("/pagamenti");
    await expect(
      signedInAdmin.getByRole("heading", { level: 1, name: /Pagamenti/i })
    ).toBeVisible({ timeout: 10_000 });

    const azienda = signedInAdmin
      .getByRole("link")
      .filter({ hasText: FIXTURE.azienda.nome });
    await expect(azienda.first()).toBeVisible({ timeout: 10_000 });

    const stato = signedInAdmin.getByLabel("Stato");
    await expect(stato).toBeVisible();
    await stato.selectOption("unpaid");
    await expect(azienda.first()).toBeVisible();
  });
});
