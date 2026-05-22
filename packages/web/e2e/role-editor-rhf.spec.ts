import { expect, test } from "./setup/auth";

test.describe("role editor (rhf)", () => {
  test("shows inline validation when the id is invalid and stays on the page", async ({
    signedInAdmin,
  }) => {
    await signedInAdmin.goto("/admin/ruoli/nuovo");
    await expect(
      signedInAdmin.getByRole("heading", { level: 1, name: /Nuovo ruolo/i })
    ).toBeVisible({ timeout: 15_000 });

    await signedInAdmin.getByLabel(/Identificativo/i).fill("Bad ID");
    await signedInAdmin.getByLabel(/Nome visibile/i).fill("E2E invalid");
    await signedInAdmin.getByRole("button", { name: /Salva/i }).click();

    await expect(
      signedInAdmin
        .getByRole("alert")
        .filter({ hasText: /Lowercase, lettere e trattini/i })
    ).toBeVisible({ timeout: 5_000 });
    await expect(signedInAdmin).toHaveURL(/\/admin\/ruoli\/nuovo$/);
  });

  test("creates a new role with a description and capabilities", async ({
    signedInAdmin,
  }) => {
    const suffix = Date.now().toString().slice(-6);
    const roleId = `rhf-role-${suffix}`;
    const roleName = `RHF Role ${suffix}`;

    await signedInAdmin.goto("/admin/ruoli/nuovo");
    await expect(
      signedInAdmin.getByRole("heading", { level: 1, name: /Nuovo ruolo/i })
    ).toBeVisible({ timeout: 15_000 });

    await signedInAdmin.getByLabel(/Identificativo/i).fill(roleId);
    await signedInAdmin.getByLabel(/Nome visibile/i).fill(roleName);
    await signedInAdmin
      .getByLabel(/Descrizione/i)
      .fill("Ruolo creato dal test e2e RHF");

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

  test("hydrates an existing role and persists an edit through RHF", async ({
    signedInAdmin,
  }) => {
    const suffix = Date.now().toString().slice(-6);
    const renamed = `Veterinario ${suffix}`;

    await signedInAdmin.goto("/admin/ruoli/vet");
    await expect(
      signedInAdmin.getByRole("heading", { level: 1, name: /Modifica ruolo/i })
    ).toBeVisible({ timeout: 15_000 });
    await expect(signedInAdmin.getByLabel(/Nome visibile/i)).toHaveValue(
      /Veterinario/i,
      { timeout: 10_000 }
    );

    await signedInAdmin.getByLabel(/Nome visibile/i).fill(renamed);
    await signedInAdmin.getByRole("button", { name: /Salva/i }).click();

    await expect(signedInAdmin).toHaveURL(/\/admin\/ruoli$/, {
      timeout: 15_000,
    });
    await expect(
      signedInAdmin.getByRole("heading", { level: 2, name: new RegExp(renamed) })
    ).toBeVisible({ timeout: 10_000 });
  });
});
