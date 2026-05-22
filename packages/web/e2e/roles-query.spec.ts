import { expect, test } from "./setup/auth";

test.describe("admin roles (tanstack query)", () => {
  test("admin sees seeded roles in the list", async ({ signedInAdmin }) => {
    await signedInAdmin.goto("/admin/ruoli");
    await expect(
      signedInAdmin.getByRole("heading", { level: 1, name: /Ruoli/i })
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      signedInAdmin.getByRole("heading", { level: 2, name: /Amministratore/i })
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      signedInAdmin.getByRole("heading", { level: 2, name: /Veterinario/i })
    ).toBeVisible();
  });

  test("admin creates a new role and sees it appear in the list", async ({
    signedInAdmin,
  }) => {
    const suffix = Date.now().toString().slice(-6);
    const roleId = `e2e-role-${suffix}`;
    const roleName = `E2E Role ${suffix}`;

    await signedInAdmin.goto("/admin/ruoli/nuovo");
    await expect(
      signedInAdmin.getByRole("heading", { level: 1, name: /Nuovo ruolo/i })
    ).toBeVisible({ timeout: 15_000 });

    await signedInAdmin.getByLabel(/Identificativo/i).fill(roleId);
    await signedInAdmin.getByLabel(/Nome visibile/i).fill(roleName);

    const firstCap = signedInAdmin.locator('input[type="checkbox"]').first();
    await firstCap.check();

    await signedInAdmin.getByRole("button", { name: /Salva/i }).click();

    await expect(signedInAdmin).toHaveURL(/\/admin\/ruoli$/, {
      timeout: 15_000,
    });

    await expect(
      signedInAdmin.getByRole("heading", { level: 2, name: new RegExp(roleName) })
    ).toBeVisible({ timeout: 10_000 });
  });

  test("admin opens an existing role and sees it loaded", async ({
    signedInAdmin,
  }) => {
    await signedInAdmin.goto("/admin/ruoli/vet");
    await expect(
      signedInAdmin.getByRole("heading", {
        level: 1,
        name: /Modifica ruolo/i,
      })
    ).toBeVisible({ timeout: 15_000 });
    await expect(signedInAdmin.getByLabel(/Nome visibile/i)).toHaveValue(
      /Veterinario/i,
      { timeout: 10_000 }
    );
  });
});
