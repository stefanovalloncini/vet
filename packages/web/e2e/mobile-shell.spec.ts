import { expect, test } from "@playwright/test";

// These tests verify the mobile bottom-nav layout invariants that M6.0 was
// meant to fix. They run unauthenticated against /login, where the mobile
// nav is absent — proves we can shape the asserts without auth. Authenticated
// equivalents live in attivita/aziende/agenda specs that already log in.

test.describe("mobile shell — login viewport robustness", () => {
  test("login page has no horizontal overflow", async ({ page }) => {
    await page.goto("/login");
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      const body = document.body;
      return {
        clientWidth: doc.clientWidth,
        scrollWidth: Math.max(doc.scrollWidth, body.scrollWidth),
      };
    });
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
  });

  test("login page main content fits without a scroll on standard mobile heights", async ({
    page,
  }) => {
    await page.goto("/login");
    const v = page.viewportSize();
    if (!v || v.height < 600) {
      test.skip();
      return;
    }
    const docHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(docHeight).toBeLessThanOrEqual(v.height + 1);
  });
});
