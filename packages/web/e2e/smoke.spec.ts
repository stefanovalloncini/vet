import { expect, test } from "@playwright/test";

test("unauthenticated visit to / redirects to /login", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Accedi a Vet");
});
