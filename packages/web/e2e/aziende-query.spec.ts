import { expect, test } from "./setup/auth";
import { FIXTURE, restoreSeededFixture } from "./setup/seed";

test.describe("aziende query layer", () => {
  test.beforeEach(async () => {
    await restoreSeededFixture();
  });

  test("list renders seeded azienda after sign-in", async ({ signedInVet }) => {
    await signedInVet.goto("/aziende");
    await expect(signedInVet.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      signedInVet
        .getByRole("link")
        .filter({ hasText: FIXTURE.azienda.nome })
        .first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("create invalidates the list so the new azienda shows without reload", async ({
    signedInVet,
  }) => {
    const unique = `Q1 Stalla ${Date.now().toString().slice(-6)}`;
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
