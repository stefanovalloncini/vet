import { expect, test } from "./setup/auth";
import { restoreSeededFixture } from "./setup/seed";

test.describe("statistiche (tanstack query)", () => {
  test.beforeEach(async () => {
    await restoreSeededFixture();
  });

  test("renders the page with a single h1 and the period selector", async ({
    signedInVet,
  }) => {
    await signedInVet.goto("/statistiche");
    await expect(
      signedInVet.getByRole("heading", { level: 1, name: /Statistiche/i })
    ).toBeVisible({ timeout: 15_000 });
    await expect(signedInVet.getByLabel("Periodo")).toBeVisible();
  });

  test("changing the period does not break the layout", async ({
    signedInVet,
  }) => {
    await signedInVet.goto("/statistiche");
    await expect(
      signedInVet.getByRole("heading", { level: 1, name: /Statistiche/i })
    ).toBeVisible({ timeout: 15_000 });

    await signedInVet.getByLabel("Periodo").selectOption("ytd");
    await expect(
      signedInVet.getByRole("heading", { level: 1, name: /Statistiche/i })
    ).toBeVisible();

    await signedInVet.getByLabel("Periodo").selectOption("all");
    await expect(
      signedInVet.getByRole("heading", { level: 1, name: /Statistiche/i })
    ).toBeVisible();
  });

  test("renders without overflow on a narrow mobile viewport", async ({
    signedInVet,
  }) => {
    await signedInVet.setViewportSize({ width: 320, height: 720 });
    await signedInVet.goto("/statistiche");
    await expect(
      signedInVet.getByRole("heading", { level: 1, name: /Statistiche/i })
    ).toBeVisible({ timeout: 15_000 });

    const overflow = await signedInVet.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
