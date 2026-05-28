import { expect, test } from "./setup/auth";
import { restoreSeededFixture } from "./setup/seed";

test.describe("dashboard / riepilogo (tanstack query)", () => {
  test.beforeEach(async () => {
    await restoreSeededFixture();
  });

  test("renders the dashboard with the KPI cards and chart", async ({
    signedInVet,
  }) => {
    await signedInVet.goto("/riepilogo");
    await expect(
      signedInVet.getByRole("heading", { level: 1, name: /Riepilogo/i })
    ).toBeVisible({ timeout: 15_000 });
    await expect(signedInVet.getByText("Attività del mese")).toBeVisible({
      timeout: 10_000,
    });
    await expect(signedInVet.getByText("Aziende attive")).toBeVisible();
  });

  test("switches the trailing chart between attività and incassi", async ({
    signedInVet,
  }) => {
    await signedInVet.goto("/riepilogo");
    await expect(
      signedInVet.getByRole("heading", { level: 1, name: /Riepilogo/i })
    ).toBeVisible({ timeout: 15_000 });

    const toggle = signedInVet.getByRole("tablist", { name: /Vista grafico/i });
    await expect(toggle).toBeVisible({ timeout: 10_000 });
    await toggle.getByRole("tab", { name: "Incassi" }).click();
    await expect(
      signedInVet.getByText(/Incassi ultimi 12 mesi/i)
    ).toBeVisible();
  });

  test("renders without horizontal overflow on a narrow viewport", async ({
    signedInVet,
  }) => {
    await signedInVet.setViewportSize({ width: 320, height: 720 });
    await signedInVet.goto("/riepilogo");
    await expect(
      signedInVet.getByRole("heading", { level: 1, name: /Riepilogo/i })
    ).toBeVisible({ timeout: 15_000 });

    const overflow = await signedInVet.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
