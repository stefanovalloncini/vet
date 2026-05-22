import { expect, test } from "./setup/auth";

test.describe("admin allowlist (tanstack-query)", () => {
  test("admin sees the seeded entries on the allowlist tab", async ({
    signedInAdmin,
  }) => {
    await signedInAdmin.goto("/admin/allowlist");
    await expect(signedInAdmin.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      signedInAdmin.getByText(/admin\.e2e@example\.com/)
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      signedInAdmin.getByText(/vet\.e2e@example\.com/)
    ).toBeVisible();
  });

  test("admin can add a new email and the list refetches", async ({
    signedInAdmin,
  }) => {
    const unique = `e2e-${Date.now().toString().slice(-6)}@vet.it`;
    await signedInAdmin.goto("/admin/allowlist");
    await expect(signedInAdmin.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 15_000,
    });

    await signedInAdmin
      .getByRole("button", { name: /Aggiungi/i })
      .first()
      .click();
    await signedInAdmin.getByLabel(/Email/i).first().fill(unique);
    await signedInAdmin
      .getByRole("button", { name: /Aggiungi email/i })
      .click();

    await expect(signedInAdmin.getByText(unique)).toBeVisible({
      timeout: 10_000,
    });
  });
});
