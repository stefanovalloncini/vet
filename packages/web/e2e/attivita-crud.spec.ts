import { expect, test } from "./setup/auth";
import { FIXTURE } from "./setup/seed";

test.describe("attivita CRUD", () => {
  test("vet sees seeded attivita in list", async ({ signedInVet }) => {
    await signedInVet.goto("/attivita");
    await expect(signedInVet.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      signedInVet.getByRole("heading", {
        level: 2,
        name: new RegExp(FIXTURE.azienda.nome),
      })
    ).toBeVisible({ timeout: 10_000 });
  });

  test("vet creates a new attivita against seeded azienda", async ({
    signedInVet,
  }) => {
    await signedInVet.goto("/attivita/nuova");
    await expect(signedInVet.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 15_000,
    });

    await signedInVet.getByLabel(/Data/i).fill("2026-05-20");
    await signedInVet
      .getByLabel(/Azienda/i, { exact: false })
      .selectOption(FIXTURE.azienda.id);
    await signedInVet
      .getByLabel(/Tipo/i, { exact: false })
      .first()
      .selectOption(FIXTURE.tipo.id);
    await signedInVet.getByLabel(/Tariffa/i).fill("100");

    await signedInVet.getByRole("button", { name: /Salva/i }).click();

    await expect(signedInVet).toHaveURL(/\/attivita(\?|$)/, { timeout: 15_000 });
  });
});
