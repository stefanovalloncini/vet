import { expect, test } from "@playwright/test";

test("unauthenticated visit to / redirects to /login", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Accedi");
});

test("login page exposes Google and email-link affordances", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: /Continua con Google/i })).toBeVisible();
  await expect(page.getByLabel(/Email/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /Inviami il link/i })).toBeVisible();
});
