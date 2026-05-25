import { expect, test } from "./setup/auth";
import { FIXTURE } from "./setup/seed";

test.describe("attivita query layer", () => {
  test("list renders seeded attivita after sign-in", async ({ signedInVet }) => {
    await signedInVet.goto("/attivita");
    await expect(signedInVet.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      signedInVet
        .getByRole("link", { name: new RegExp(FIXTURE.azienda.nome) })
        .first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("create invalidates the list so the new attivita shows without reload", async ({
    signedInVet,
  }) => {
    const tariffaMarker = 100 + (Date.now() % 800);
    await signedInVet.goto("/attivita/nuova");
    await expect(signedInVet.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 15_000,
    });

    await signedInVet.getByLabel(/Data/i).fill("2026-05-21");
    await signedInVet
      .getByLabel(/Azienda/i, { exact: false })
      .selectOption(FIXTURE.azienda.id);
    await signedInVet
      .getByLabel(/Tipo/i, { exact: false })
      .first()
      .selectOption(FIXTURE.tipo.id);
    await signedInVet.getByLabel(/Tariffa/i).fill(String(tariffaMarker));

    await signedInVet.getByRole("button", { name: /Salva/i }).click();

    await expect(signedInVet).toHaveURL(/\/attivita(\?|$)/, { timeout: 15_000 });
    await expect(
      signedInVet.getByText(new RegExp(`${tariffaMarker}[,.]00`))
    ).toBeVisible({ timeout: 10_000 });
  });
});
