import { expect, test } from "./setup/auth";
import { restoreSeededFixture } from "./setup/seed";

test.describe("cestino UI", () => {
  test.beforeEach(async () => {
    await restoreSeededFixture();
  });

  test("shows one heading and the empty state for a vet", async ({
    signedInVet,
  }) => {
    await signedInVet.goto("/cestino");
    await expect(
      signedInVet.getByRole("heading", { level: 1, name: /Cestino/i })
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      signedInVet.getByText(/Niente nel cestino\./i)
    ).toBeVisible({ timeout: 10_000 });
  });

  test("admin sees the mine/all tabs", async ({ signedInAdmin }) => {
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
