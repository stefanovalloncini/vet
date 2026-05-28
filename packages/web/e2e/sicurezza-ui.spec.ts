import { expect, test } from "./setup/auth";

test.describe("sicurezza diagnostics UI", () => {
  test("renders one heading and lists every probe", async ({ page }) => {
    await page.goto("/sicurezza");
    await expect(
      page.getByRole("heading", { level: 1, name: /Stato del browser/i })
    ).toBeVisible({ timeout: 15_000 });

    await expect(page.getByText("Cookie del browser")).toBeVisible();
    await expect(page.getByText("Memoria locale del browser")).toBeVisible();
    await expect(page.getByText(/Token anti-bot/i)).toBeVisible();
  });

  test("offers retry and a link back to login", async ({ page }) => {
    await page.goto("/sicurezza");
    await expect(
      page.getByRole("heading", { level: 1 })
    ).toBeVisible({ timeout: 15_000 });

    await expect(
      page.getByRole("button", { name: /Riprova/i })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Torna all'accesso/i })
    ).toBeVisible();
  });

  test("settles into a final state after the probes run", async ({ page }) => {
    await page.goto("/sicurezza");
    await expect(
      page.getByRole("heading", { level: 1 })
    ).toBeVisible({ timeout: 15_000 });

    const list = page.getByRole("list").first();
    await expect(list).toHaveAttribute("aria-busy", "false", {
      timeout: 15_000,
    });
  });
});
