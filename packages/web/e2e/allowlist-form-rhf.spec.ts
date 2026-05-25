import { expect, test } from "./setup/auth";
import { restoreSeededFixture } from "./setup/seed";

test.describe("admin allowlist (rhf forms)", () => {
  test.beforeEach(async () => {
    await restoreSeededFixture();
  });

  test("invalid email shows a field-level error and does not submit", async ({
    signedInAdmin,
  }) => {
    await signedInAdmin.goto("/admin/allowlist");
    await expect(signedInAdmin.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 15_000,
    });

    await signedInAdmin
      .getByRole("button", { name: /Aggiungi/i })
      .first()
      .click();
    await signedInAdmin.getByLabel(/Email/i).first().fill("not-an-email");
    await signedInAdmin
      .getByRole("button", { name: /Aggiungi email/i })
      .click();

    await expect(signedInAdmin.getByRole("alert").first()).toBeVisible({
      timeout: 5_000,
    });
    await expect(signedInAdmin.getByText("not-an-email")).toHaveCount(0);
  });

  test("admin can submit a valid entry and the list refreshes", async ({
    signedInAdmin,
  }) => {
    const unique = `rhf-${Date.now().toString().slice(-6)}@vet.it`;
    await signedInAdmin.goto("/admin/allowlist");
    await expect(signedInAdmin.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 15_000,
    });

    await signedInAdmin
      .getByRole("button", { name: /Aggiungi/i })
      .first()
      .click();
    const emailField = signedInAdmin.getByLabel(/Email/i).first();
    await emailField.fill(unique);
    await signedInAdmin
      .getByRole("button", { name: /Aggiungi email/i })
      .click();

    await expect(
      signedInAdmin.locator("main").getByText(unique)
    ).toBeVisible({ timeout: 15_000 });
  });

  test("Annulla closes the form without writing", async ({ signedInAdmin }) => {
    await signedInAdmin.goto("/admin/allowlist");
    await expect(signedInAdmin.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 15_000,
    });

    await signedInAdmin
      .getByRole("button", { name: /Aggiungi/i })
      .first()
      .click();
    const emailField = signedInAdmin.getByLabel(/Email/i).first();
    await expect(emailField).toBeVisible();
    await signedInAdmin.getByRole("button", { name: /Annulla/i }).click();
    await expect(emailField).toBeHidden({ timeout: 5_000 });
  });
});
