import { expect, test } from "./setup/auth";
import { FIXTURE, restoreSeededFixture } from "./setup/seed";

test.describe("activity type forms via react-hook-form", () => {
  test.beforeEach(async () => {
    await restoreSeededFixture();
  });

  test("admin edits tariffa for a seeded tipo", async ({ signedInAdmin }) => {
    await signedInAdmin.goto("/admin/tipi-attivita");
    await expect(
      signedInAdmin.getByRole("heading", { level: 1, name: /Tipi di attività/i })
    ).toBeVisible({ timeout: 15_000 });

    const tariffaInput = signedInAdmin.locator(`#tariffa-${FIXTURE.tipo.id}`);
    await expect(tariffaInput).toHaveValue("80");

    await tariffaInput.fill("120");
    await signedInAdmin.getByRole("button", { name: /^Salva$/i }).click();

    await expect(tariffaInput).toHaveValue("120", { timeout: 10_000 });
  });

  test("admin sees inline error when tariffa is negative", async ({
    signedInAdmin,
  }) => {
    await signedInAdmin.goto("/admin/tipi-attivita");
    await expect(
      signedInAdmin.getByRole("heading", { level: 1 })
    ).toBeVisible({ timeout: 15_000 });

    const tariffaInput = signedInAdmin.locator(`#tariffa-${FIXTURE.tipo.id}`);
    await tariffaInput.fill("-1");
    await signedInAdmin.getByRole("button", { name: /^Salva$/i }).click();

    await expect(
      signedInAdmin.getByText(/Tariffa non valida/i).first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test("admin creates a new tipo through the quick-add dialog", async ({
    signedInAdmin,
  }) => {
    await signedInAdmin.goto("/attivita/nuova");
    await expect(
      signedInAdmin.getByRole("heading", { level: 1 })
    ).toBeVisible({ timeout: 15_000 });

    await signedInAdmin
      .getByRole("button", { name: /^\+\s*Nuovo$/ })
      .click();

    const dialog = signedInAdmin.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/Nuovo tipo di attività/i)).toBeVisible();

    await dialog.getByLabel(/^Nome$/i).fill("Castrazione");
    await dialog.getByLabel(/Tariffa standard/i).fill("200");
    await dialog.getByRole("button", { name: /^Crea$/i }).click();

    await expect(dialog).toBeHidden({ timeout: 10_000 });

    await signedInAdmin.goto("/admin/tipi-attivita");
    await expect(
      signedInAdmin.getByText(/Castrazione/i).first()
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      signedInAdmin.locator("#tariffa-castrazione")
    ).toHaveValue("200");
  });

  test("admin sees a field error when creating a tipo with bad tariffa", async ({
    signedInAdmin,
  }) => {
    await signedInAdmin.goto("/attivita/nuova");
    await expect(
      signedInAdmin.getByRole("heading", { level: 1 })
    ).toBeVisible({ timeout: 15_000 });

    await signedInAdmin
      .getByRole("button", { name: /^\+\s*Nuovo$/ })
      .click();

    const dialog = signedInAdmin.getByRole("dialog");
    await dialog.getByLabel(/^Nome$/i).fill("Profilassi extra");
    await dialog.getByLabel(/Tariffa standard/i).fill("-10");
    await dialog.getByRole("button", { name: /^Crea$/i }).click();

    await expect(
      dialog.getByText(/Tariffa non valida/i)
    ).toBeVisible({ timeout: 5_000 });
  });
});
