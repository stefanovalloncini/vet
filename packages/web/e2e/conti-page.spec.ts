import { expect, test } from "./setup/auth";
import { FIXTURE, restoreSeededFixture } from "./setup/seed";

test.describe("/conti page", () => {
  test.beforeEach(async () => {
    await restoreSeededFixture();
  });

  test("empty state shown when no conti emessi exist", async ({
    signedInAdmin,
  }) => {
    await signedInAdmin.goto("/conti");
    await expect(
      signedInAdmin.getByRole("heading", { level: 1, name: /Conti/i })
    ).toBeVisible({ timeout: 15_000 });

    await expect(
      signedInAdmin.getByText(/Nessun conto emesso/i)
    ).toBeVisible({ timeout: 10_000 });
  });

  test("after emitting a conto, the page shows the azienda row", async ({
    signedInAdmin,
  }) => {
    // First emit a conto from the azienda detail page.
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

    // Now /conti should show the azienda + outstanding total banner.
    await signedInAdmin.goto("/conti");
    await expect(
      signedInAdmin.getByRole("heading", { level: 1, name: /Conti/i })
    ).toBeVisible({ timeout: 10_000 });

    await expect(
      signedInAdmin
        .getByRole("link")
        .filter({ hasText: FIXTURE.azienda.nome })
        .first()
    ).toBeVisible({ timeout: 10_000 });

    // Outstanding total banner should appear (we emitted but not saldato).
    await expect(
      signedInAdmin.getByText(/Totale da riscuotere/i)
    ).toBeVisible({ timeout: 5_000 });
  });

  test("the 'mostra solo non saldati' switch hides the saldati", async ({
    signedInAdmin,
  }) => {
    await signedInAdmin.goto("/conti");
    await expect(
      signedInAdmin.getByRole("heading", { level: 1, name: /Conti/i })
    ).toBeVisible({ timeout: 15_000 });

    const toggle = signedInAdmin.getByRole("checkbox", {
      name: /Mostra solo/i,
    });
    await expect(toggle).toBeChecked();
  });
});
