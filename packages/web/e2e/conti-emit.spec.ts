import { expect, test } from "./setup/auth";
import { FIXTURE, restoreSeededFixture } from "./setup/seed";

test.describe("conti emit + saldo", () => {
  test.beforeEach(async () => {
    await restoreSeededFixture();
  });

  test("vet semplice can save a proforma from an azienda detail page", async ({
    signedInVet,
  }) => {
    await signedInVet.goto(`/aziende/${FIXTURE.azienda.id}`);
    await expect(
      signedInVet.getByRole("heading", { level: 1, name: FIXTURE.azienda.nome })
    ).toBeVisible({ timeout: 15_000 });

    const emetti = signedInVet.getByText(/Emetti conto/i).first();
    await expect(emetti).toBeVisible({ timeout: 10_000 });

    const proformaBtn = signedInVet.getByRole("button", {
      name: /Salva come pro forma/i,
    });
    await expect(proformaBtn).toBeVisible();

    const emitOfficialBtn = signedInVet.getByRole("button", {
      name: /^Emetti conto$/i,
    });
    await expect(emitOfficialBtn).toHaveCount(0);
  });

  test("admin can emit an official conto, see it on /conti, and mark it as saldato", async ({
    signedInAdmin,
  }) => {
    await signedInAdmin.goto(`/aziende/${FIXTURE.azienda.id}`);
    await expect(
      signedInAdmin.getByRole("heading", { level: 1, name: FIXTURE.azienda.nome })
    ).toBeVisible({ timeout: 15_000 });

    const fromInput = signedInAdmin.locator('input[type="date"]').first();
    const toInput = signedInAdmin.locator('input[type="date"]').nth(1);
    await fromInput.fill("2026-05-01");
    await toInput.fill("2026-05-31");

    await expect(signedInAdmin.getByText(/Attività:\s*1/)).toBeVisible({
      timeout: 5_000,
    });

    await signedInAdmin
      .getByRole("button", { name: /^Emetti conto$/i })
      .click();
    await signedInAdmin
      .getByRole("button", { name: /^Emetti$/i })
      .click();

    await expect(
      signedInAdmin.getByText(/Conto emesso/i)
    ).toBeVisible({ timeout: 10_000 });

    await signedInAdmin.goto("/conti");
    await expect(
      signedInAdmin.getByRole("heading", { level: 1, name: /Conti/i })
    ).toBeVisible({ timeout: 10_000 });

    const aziendaRow = signedInAdmin
      .getByRole("link")
      .filter({ hasText: FIXTURE.azienda.nome });
    await expect(aziendaRow.first()).toBeVisible({ timeout: 10_000 });

    await aziendaRow.first().click();
    await expect(
      signedInAdmin.getByRole("heading", { level: 1, name: FIXTURE.azienda.nome })
    ).toBeVisible({ timeout: 10_000 });

    const saldaBtn = signedInAdmin.getByRole("button", {
      name: /Segna saldato/i,
    });
    await expect(saldaBtn.first()).toBeVisible({ timeout: 10_000 });
    await saldaBtn.first().click();

    await expect(
      signedInAdmin.getByText(/Saldato/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("admin emitting an empty period is blocked (no activities in range)", async ({
    signedInAdmin,
  }) => {
    await signedInAdmin.goto(`/aziende/${FIXTURE.azienda.id}`);
    await expect(
      signedInAdmin.getByRole("heading", { level: 1, name: FIXTURE.azienda.nome })
    ).toBeVisible({ timeout: 15_000 });

    const fromInput = signedInAdmin.locator('input[type="date"]').first();
    const toInput = signedInAdmin.locator('input[type="date"]').nth(1);
    await fromInput.fill("2024-01-01");
    await toInput.fill("2024-01-31");

    await expect(
      signedInAdmin.getByText(/Nessuna attività nel periodo scelto/i)
    ).toBeVisible({ timeout: 5_000 });

    const emitBtn = signedInAdmin.getByRole("button", { name: /^Emetti conto$/i });
    await expect(emitBtn).toBeDisabled();
  });
});
