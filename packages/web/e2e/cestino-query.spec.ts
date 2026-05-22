import { expect, test } from "./setup/auth";

test.describe("cestino (tanstack query)", () => {
  test("renders the cestino page heading and empty state for vet", async ({
    signedInVet,
  }) => {
    await signedInVet.goto("/cestino");
    await expect(
      signedInVet.getByRole("heading", { level: 1, name: /Cestino/i })
    ).toBeVisible({ timeout: 15_000 });
  });

  test("admin sees the mine/all tab switch on cestino", async ({
    signedInAdmin,
  }) => {
    await signedInAdmin.goto("/cestino");
    await expect(
      signedInAdmin.getByRole("heading", { level: 1, name: /Cestino/i })
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      signedInAdmin.getByRole("tab", { name: /Le mie/i })
    ).toBeVisible();
    await expect(
      signedInAdmin.getByRole("tab", { name: /Di tutti/i })
    ).toBeVisible();
  });
});
