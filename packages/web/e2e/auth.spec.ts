import { expect, test } from "./setup/auth";

test.describe("auth gating", () => {
  test("anonymous visit to / redirects to /login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("pending user sees approval screen", async ({ signedInPending }) => {
    await signedInPending.goto("/");
    await expect(
      signedInPending.getByRole("heading", {
        name: /Account in attesa di approvazione/i,
      })
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      signedInPending.getByRole("button", { name: /Esci/i })
    ).toBeVisible();
  });

  test("approved admin reaches the home shell", async ({ signedInAdmin }) => {
    await signedInAdmin.goto("/");
    await expect(signedInAdmin).not.toHaveURL(/\/login/, { timeout: 15_000 });
    await expect(
      signedInAdmin.getByRole("heading", {
        name: /Account in attesa di approvazione/i,
      })
    ).toBeHidden();
  });
});
