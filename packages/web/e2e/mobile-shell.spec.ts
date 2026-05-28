import { expect, test } from "@playwright/test";
import {
  expect as authExpect,
  test as authTest,
} from "./setup/auth";
import { restoreSeededFixture } from "./setup/seed";

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

authTest.describe("mobile shell — authenticated bottom navigation", () => {
  authTest.beforeEach(async () => {
    await restoreSeededFixture();
  });

  authTest("bottom nav navigates and marks the active tab at 360px", async ({
    signedInVet,
  }) => {
    await signedInVet.setViewportSize({ width: 360, height: 780 });
    await signedInVet.goto("/agenda");
    await authExpect(
      signedInVet.getByRole("heading", { level: 1 })
    ).toBeVisible({ timeout: 15_000 });

    const bottomNav = signedInVet.getByRole("navigation", {
      name: /Navigazione principale/i,
    });
    await authExpect(bottomNav).toBeVisible();

    const aziende = bottomNav.getByRole("link", { name: /Aziende/i });
    await aziende.click();
    await authExpect(signedInVet).toHaveURL(/\/aziende/, { timeout: 10_000 });
    await authExpect(
      bottomNav.getByRole("link", { name: /Aziende/i })
    ).toHaveAttribute("aria-current", "page", { timeout: 10_000 });
  });

  authTest("mobile header controls keep a 44px touch target", async ({
    signedInVet,
  }) => {
    await signedInVet.setViewportSize({ width: 360, height: 780 });
    await signedInVet.goto("/agenda");
    await authExpect(
      signedInVet.getByRole("heading", { level: 1 })
    ).toBeVisible({ timeout: 15_000 });

    const search = signedInVet.getByRole("button", { name: /^Cerca$/i });
    await authExpect(search).toBeVisible();
    const box = await search.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
  });

  authTest("bottom nav is hidden on a desktop-width viewport", async ({
    signedInVet,
  }) => {
    await signedInVet.setViewportSize({ width: 1280, height: 900 });
    await signedInVet.goto("/agenda");
    await authExpect(
      signedInVet.getByRole("heading", { level: 1 })
    ).toBeVisible({ timeout: 15_000 });

    await authExpect(
      signedInVet.getByRole("navigation", { name: /Navigazione principale/i })
    ).toBeHidden();
  });
});
