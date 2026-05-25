import { expect, test } from "@playwright/test";

test.describe("login — mobile layout", () => {
  test("renders the brand, heading, and both sign-in affordances fully on screen", async ({
    page,
  }, testInfo) => {
    await page.goto("/login");

    const heading = page.getByRole("heading", { level: 1, name: "Entra nel tuo account" });
    const emailSubmit = page.getByRole("button", { name: /Invia magic link/i });
    const googleBtn = page.getByRole("button", { name: /Entra con Google/i });
    const themeToggle = page.getByRole("button", { name: /Tema/i });

    await expect(heading).toBeVisible();
    await expect(emailSubmit).toBeVisible();
    await expect(googleBtn).toBeVisible();
    await expect(themeToggle).toBeVisible();

    const viewport = page.viewportSize();
    if (!viewport) {
      test.skip();
      return;
    }

    for (const [name, locator] of [
      ["emailSubmit", emailSubmit],
      ["googleBtn", googleBtn],
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
    const emailInput = page.getByLabel(/Email/i);
    await expect(emailInput).toBeVisible();
    await emailInput.click();
    await expect(emailInput).toBeFocused();

    const viewport = page.viewportSize();
    if (!viewport) return;
    const box = await emailInput.boundingBox();
    if (!box) return;
    expect(box.y).toBeLessThan(viewport.height - 120);
  });
});
