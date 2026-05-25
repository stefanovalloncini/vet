import { expect, test } from "./setup/auth";
import { FIXTURE, restoreSeededFixture } from "./setup/seed";

test.describe("voce rapida — suggestions panel", () => {
  test.beforeEach(async () => {
    await restoreSeededFixture();
  });

  test("shows the recent combo and fills the form on tap", async ({
    signedInVet,
  }) => {
    await signedInVet.goto("/attivita");
    await expect(signedInVet.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 15_000,
    });

    await signedInVet.getByRole("button", { name: /Voce rapida/i }).click();
    const dialog = signedInVet.getByRole("dialog", { name: /Voce rapida/i });
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    const suggestion = dialog.getByRole("button", {
      name: new RegExp(FIXTURE.azienda.nome, "i"),
    });
    await expect(suggestion).toBeVisible({ timeout: 10_000 });
    await expect(suggestion).toHaveAttribute("aria-pressed", "false");

    await suggestion.click();

    await expect(suggestion).toHaveAttribute("aria-pressed", "true");
    await expect(dialog.getByLabel("Azienda", { exact: true })).toHaveValue(
      FIXTURE.azienda.id
    );
    await expect(dialog.getByLabel("Tipo", { exact: true })).toHaveValue(
      FIXTURE.tipo.id
    );
    await expect(dialog.getByLabel(/Tariffa/i)).toHaveValue("80");
  });

  test("does not show the Frequenti tab with a single combo", async ({
    signedInVet,
  }) => {
    await signedInVet.goto("/attivita");
    await expect(signedInVet.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 15_000,
    });
    await signedInVet.getByRole("button", { name: /Voce rapida/i }).click();
    const dialog = signedInVet.getByRole("dialog", { name: /Voce rapida/i });
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    await expect(
      dialog.getByRole("tab", { name: /Recenti/i })
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      dialog.getByRole("tab", { name: /Frequenti/i })
    ).toHaveCount(0);
  });
});
