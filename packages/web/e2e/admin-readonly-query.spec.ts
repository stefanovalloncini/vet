import { expect, test } from "./setup/auth";
import { FIXTURE } from "./setup/seed";

test.describe("admin readonly pages backed by tanstack query", () => {
  test("admin loads audit log without error", async ({ signedInAdmin }) => {
    await signedInAdmin.goto("/admin/audit");
    await expect(
      signedInAdmin.getByRole("heading", { level: 1, name: /Audit log/i })
    ).toBeVisible({ timeout: 15_000 });
    await expect(signedInAdmin.getByText(/Caricamento fallito\./i)).toBeHidden({
      timeout: 10_000,
    });
  });

  test("admin loads vet stats and sees seeded vet entry", async ({
    signedInAdmin,
  }) => {
    await signedInAdmin.goto("/admin/stats-vet");
    await expect(
      signedInAdmin.getByRole("heading", {
        level: 1,
        name: /Statistiche veterinari/i,
      })
    ).toBeVisible({ timeout: 15_000 });
    await signedInAdmin
      .getByLabel(/Periodo/i)
      .selectOption("all");
    await expect(
      signedInAdmin.getByText(new RegExp(FIXTURE.vet.displayName)).first()
    ).toBeVisible({ timeout: 10_000 });
  });
});
