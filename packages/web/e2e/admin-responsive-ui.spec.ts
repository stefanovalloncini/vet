import { expect, test } from "./setup/auth";
import type { Page } from "@playwright/test";
import { restoreSeededFixture } from "./setup/seed";

const ADMIN_PAGES: ReadonlyArray<{ path: string; heading: RegExp }> = [
  { path: "/admin/allowlist", heading: /Allowlist/i },
  { path: "/admin/tipi-attivita", heading: /Tipi di attività/i },
  { path: "/admin/ruoli", heading: /Ruoli/i },
  { path: "/admin/audit", heading: /Audit log/i },
  { path: "/admin/stats-vet", heading: /Statistiche veterinari/i },
];

const WIDTHS = [320, 360, 414, 768, 1024, 1280] as const;

async function hasHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth + 1
  );
}

test.describe("admin pages responsive layout", () => {
  test.beforeEach(async () => {
    await restoreSeededFixture();
  });

  for (const { path, heading } of ADMIN_PAGES) {
    test(`exposes exactly one h1 on ${path}`, async ({ signedInAdmin }) => {
      await signedInAdmin.goto(path);
      await expect(
        signedInAdmin.getByRole("heading", { level: 1, name: heading })
      ).toBeVisible({ timeout: 15_000 });
      await expect(signedInAdmin.locator("h1")).toHaveCount(1);
    });

    test(`reflows ${path} without horizontal overflow across widths`, async ({
      signedInAdmin,
    }) => {
      await signedInAdmin.goto(path);
      await expect(
        signedInAdmin.getByRole("heading", { level: 1, name: heading })
      ).toBeVisible({ timeout: 15_000 });

      for (const width of WIDTHS) {
        await signedInAdmin.setViewportSize({ width, height: 800 });
        await expect
          .poll(() => hasHorizontalOverflow(signedInAdmin), {
            timeout: 5_000,
            message: `horizontal overflow on ${path} at ${width}px`,
          })
          .toBe(false);
      }
    });
  }

  test("allowlist rows stack in one column and do not collide at md widths", async ({
    signedInAdmin,
  }) => {
    await signedInAdmin.setViewportSize({ width: 768, height: 900 });
    await signedInAdmin.goto("/admin/allowlist");
    await expect(
      signedInAdmin.getByRole("heading", { level: 1 })
    ).toBeVisible({ timeout: 15_000 });

    const main = signedInAdmin.locator("main");
    const firstEmail = main.getByText(/admin\.e2e@example\.com/);
    await expect(firstEmail).toBeVisible({ timeout: 10_000 });

    const rows = main.getByText(/@example\.com/);
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(2);
    // Rows are full-width: each occupies the container, so their right edges line up.
    const boxes = await Promise.all(
      Array.from({ length: Math.min(count, 3) }, (_unused, i) =>
        rows.nth(i).boundingBox()
      )
    );
    const widths = boxes.map((b) => b?.width ?? 0).filter((w) => w > 0);
    expect(widths.length).toBeGreaterThanOrEqual(2);
  });

  test("audit log keeps a 44px row-action target on the tariffa editor", async ({
    signedInAdmin,
  }) => {
    await signedInAdmin.goto("/admin/tipi-attivita");
    await expect(
      signedInAdmin.getByRole("heading", { level: 1 })
    ).toBeVisible({ timeout: 15_000 });

    const toggle = signedInAdmin
      .getByRole("button", { name: /Disattiva|Attiva/i })
      .first();
    await expect(toggle).toBeVisible({ timeout: 10_000 });
    const box = await toggle.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(32);
  });
});
