import { expect, test } from "@playwright/test";

test.describe("login — mobile layout", () => {
  test("renders the brand, heading, and both sign-in buttons fully on screen", async ({
    page,
  }, testInfo) => {
    await page.goto("/login");

    const heading = page.getByRole("heading", { level: 1, name: "Entra nel tuo account" });
    const googleBtn = page.getByRole("button", { name: /Entra con Google/i });
    const emailBtn = page.getByRole("button", { name: /Entra con email/i });
    const themeToggle = page.getByRole("button", { name: /Tema/i });

    await expect(heading).toBeVisible();
    await expect(googleBtn).toBeVisible();
    await expect(emailBtn).toBeVisible();
    await expect(themeToggle).toBeVisible();

    const viewport = page.viewportSize();
    if (!viewport) {
      test.skip();
      return;
    }

    for (const [name, locator] of [
      ["googleBtn", googleBtn],
      ["emailBtn", emailBtn],
      ["themeToggle", themeToggle],
    ] as const) {
      const box = await locator.boundingBox();
      expect(box, `${name} has a bounding box`).not.toBeNull();
      if (!box) continue;
      expect.soft(box.x, `${name} not off-canvas-left`).toBeGreaterThanOrEqual(0);
      expect.soft(
        box.x + box.width,
        `${name} not off-canvas-right at viewport ${viewport.width}`
      ).toBeLessThanOrEqual(viewport.width);
    }

    testInfo.annotations.push({ type: "viewport", description: `${viewport.width}x${viewport.height}` });
  });

  test("email-link form is reachable and the input is focusable above the fold", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Entra con email/i }).click();
    const emailInput = page.getByLabel(/Email/i);
    await expect(emailInput).toBeVisible();
    await emailInput.click();
    await expect(emailInput).toBeFocused();

    const viewport = page.viewportSize();
    if (!viewport) return;
    const box = await emailInput.boundingBox();
    if (!box) return;
    // The input must be visible above the lower half of the viewport so a
    // soft keyboard does not cover it. Generous threshold.
    expect(box.y).toBeLessThan(viewport.height - 120);
  });
});
