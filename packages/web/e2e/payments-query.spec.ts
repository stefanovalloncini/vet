import { expect, test } from "./setup/auth";
import { FIXTURE } from "./setup/seed";

test.describe("payments page (tanstack query)", () => {
  test("vet sees the payments list with seeded azienda", async ({
    signedInVet,
  }) => {
    await signedInVet.goto("/pagamenti");
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

  test("vet records a payment and the row refreshes", async ({
    signedInVet,
  }) => {
    await signedInVet.goto("/pagamenti");
    await expect(signedInVet.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 15_000,
    });
    await signedInVet
      .getByRole("button", { name: /Segna pagato/i })
      .first()
      .click();

    await expect(
      signedInVet.getByRole("heading", { name: FIXTURE.azienda.nome })
    ).toBeVisible({ timeout: 10_000 });
    await signedInVet.getByLabel(/Periodo pagato fino al/i).fill("2026-05-31");
    await signedInVet.getByLabel(/Importo/i).fill("80");
    await signedInVet.getByRole("button", { name: /Salva/i }).click();

    await expect(
      signedInVet.getByText(/Pagato fino al/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });
});
