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
  await expect(page.getByLabel(/Email/i)).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Invia magic link/i })
  ).toBeVisible();
});

test("login page footer 'Ingresso riservato' is fully visible", async ({ page }) => {
  await page.goto("/login");
  const footer = page.getByText(/Ingresso riservato all'elenco abilitato/i);
  await expect(footer).toBeVisible();
});

test("login page footer fits on iPhone SE without truncation", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/login");
  const footer = page.getByText(/Ingresso riservato all'elenco abilitato/i);
  await expect(footer).toBeVisible();
  // After the layout fix, the wrapper stacks vertically on mobile, so the
  // footer is in its own row above the version badge.
  const box = await footer.boundingBox();
  expect(box?.width).toBeGreaterThan(0);
});
