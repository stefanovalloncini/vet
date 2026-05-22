import { expect, test } from "@playwright/test";

test("unauthenticated visit to / redirects to /login", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Entra nel tuo account"
  );
});

test("login page exposes Google and email-link affordances", async ({ page }) => {
  await page.goto("/login");
  await expect(
    page.getByRole("button", { name: /Entra con Google/i })
  ).toBeVisible();
  await page.getByRole("button", { name: /Entra con email/i }).click();
  await expect(page.getByLabel(/Email/i)).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Inviami il link/i })
  ).toBeVisible();
});
