import { expect, test } from "./setup/auth";
import { FIXTURE, restoreSeededFixture } from "./setup/seed";

test.describe("aziende CRUD", () => {
  test.beforeEach(async () => {
    await restoreSeededFixture();
  });

  test("list shows seeded azienda and detail navigates back", async ({
    signedInVet,
  }) => {
    await signedInVet.goto("/aziende");
    await expect(signedInVet.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 15_000,
    });
    const row = signedInVet
      .getByRole("link")
      .filter({ hasText: FIXTURE.azienda.nome });
    await expect(row.first()).toBeVisible({ timeout: 10_000 });

    await row.first().click();
    await expect(
      signedInVet.getByRole("heading", { level: 1, name: FIXTURE.azienda.nome })
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      signedInVet.getByRole("button", { name: /Modifica/i })
    ).toBeVisible();
  });

  test("vet can create a new azienda", async ({ signedInVet }) => {
    const unique = `E2E Stalla ${Date.now().toString().slice(-6)}`;
    await signedInVet.goto("/aziende/nuova");
    await expect(signedInVet.getByRole("heading", { level: 1 })).toBeVisible();

    await signedInVet.getByLabel(/Nome/i, { exact: false }).first().fill(unique);
    await signedInVet.getByRole("button", { name: /Salva/i }).click();

    await expect(signedInVet).toHaveURL(/\/aziende\/?$/, { timeout: 15_000 });
    await expect(
      signedInVet.getByRole("link").filter({ hasText: unique }).first()
    ).toBeVisible({ timeout: 10_000 });
  });
});
