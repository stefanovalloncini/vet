import { expect, test } from "./setup/auth";
import { FIXTURE, restoreSeededFixture } from "./setup/seed";

test.describe("activity types via tanstack query", () => {
  test.beforeEach(async () => {
    await restoreSeededFixture();
  });

  test("admin sees seeded tipo and edits tariffa", async ({ signedInAdmin }) => {
    await signedInAdmin.goto("/admin/tipi-attivita");
    await expect(
      signedInAdmin.getByRole("heading", { level: 1, name: /Tipi di attività/i })
    ).toBeVisible({ timeout: 15_000 });

    await expect(
      signedInAdmin.getByText(new RegExp(FIXTURE.tipo.nome))
    ).toBeVisible({ timeout: 10_000 });

    const tariffaInput = signedInAdmin.locator(
      `#tariffa-${FIXTURE.tipo.id}`
    );
    await expect(tariffaInput).toHaveValue("80");

    await tariffaInput.fill("95");
    await signedInAdmin.getByRole("button", { name: /^Salva$/i }).click();

    await expect(tariffaInput).toHaveValue("95", { timeout: 10_000 });
  });

  test("admin toggles tipo active state and sees row move", async ({
    signedInAdmin,
  }) => {
    await signedInAdmin.goto("/admin/tipi-attivita");
    await expect(
      signedInAdmin.getByRole("heading", { level: 1 })
    ).toBeVisible({ timeout: 15_000 });

    const attiviSection = signedInAdmin
      .locator("section")
      .filter({ has: signedInAdmin.getByRole("heading", { name: /^Attivi$/i }) });
    const archiviatiSection = signedInAdmin
      .locator("section")
      .filter({
        has: signedInAdmin.getByRole("heading", { name: /Archiviati/i }),
      });

    await expect(
      signedInAdmin.getByText(new RegExp(FIXTURE.tipo.nome)).first()
    ).toBeVisible({ timeout: 10_000 });

    const tipoRowInAttivi = attiviSection.getByText(new RegExp(FIXTURE.tipo.nome));
    if ((await tipoRowInAttivi.count()) === 0) {
      await archiviatiSection.getByRole("button", { name: /Attiva/i }).first().click();
      await expect(tipoRowInAttivi).toBeVisible({ timeout: 10_000 });
    }

    const attiviRow = attiviSection
      .locator("div")
      .filter({ hasText: new RegExp(FIXTURE.tipo.nome) })
      .filter({ has: signedInAdmin.getByRole("button", { name: /Disattiva/i }) })
      .first();
    await attiviRow.getByRole("button", { name: /Disattiva/i }).click();

    await expect(
      archiviatiSection.getByText(new RegExp(FIXTURE.tipo.nome))
    ).toBeVisible({ timeout: 10_000 });

    const archiviatiRow = archiviatiSection
      .locator("div")
      .filter({ hasText: new RegExp(FIXTURE.tipo.nome) })
      .filter({ has: signedInAdmin.getByRole("button", { name: /Attiva/i }) })
      .first();
    await archiviatiRow.getByRole("button", { name: /Attiva/i }).click();
    await expect(tipoRowInAttivi).toBeVisible({ timeout: 10_000 });
  });
});
