import { expect, test } from "./setup/auth";

test.describe("privacy notice UI", () => {
  test("renders one heading and the main legal sections", async ({ page }) => {
    await page.goto("/privacy");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /Informativa sul trattamento dei dati personali/i,
      })
    ).toBeVisible({ timeout: 15_000 });

    for (const title of [
      "Titolare del trattamento",
      "Conservazione",
      "Cookie e tecnologie analoghe",
    ]) {
      await expect(
        page.getByRole("heading", { level: 2, name: title })
      ).toBeVisible();
    }
  });

  test("exposes the contact mailto and the Garante link", async ({ page }) => {
    await page.goto("/privacy");
    await expect(
      page.getByRole("heading", { level: 1 })
    ).toBeVisible({ timeout: 15_000 });

    await expect(
      page.getByRole("link", { name: /stefano\.valloncini@gmail\.com/i }).first()
    ).toBeVisible();
    const garante = page.getByRole("link", { name: /garanteprivacy\.it/i });
    await expect(garante).toHaveAttribute("target", "_blank");
    await expect(garante).toHaveAttribute("rel", /noopener/);
  });
});
