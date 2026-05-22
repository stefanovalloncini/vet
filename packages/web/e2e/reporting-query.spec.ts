import { expect, test } from "./setup/auth";
import { FIXTURE } from "./setup/seed";

test.describe("reporting query reads", () => {
  test("riepilogo dashboard renders for signed-in vet", async ({ signedInVet }) => {
    await signedInVet.goto("/riepilogo");
    await expect(
      signedInVet.getByRole("heading", { level: 1, name: /Riepilogo/i })
    ).toBeVisible({ timeout: 15_000 });
  });

  test("statistiche page loads with range selector", async ({ signedInVet }) => {
    await signedInVet.goto("/statistiche");
    await expect(
      signedInVet.getByRole("heading", { level: 1, name: /Statistiche/i })
    ).toBeVisible({ timeout: 15_000 });
    await expect(signedInVet.getByLabel(/Periodo/i)).toBeVisible();
  });

  test("riepilogo pdf page renders for seeded azienda", async ({
    signedInVet,
  }) => {
    await signedInVet.goto(`/aziende/${FIXTURE.azienda.id}/riepilogo`);
    await expect(
      signedInVet.getByRole("heading", { level: 1, name: /Veterinario/i })
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      signedInVet.getByText(new RegExp(FIXTURE.azienda.nome))
    ).toBeVisible();
    await expect(
      signedInVet.getByRole("button", { name: /Stampa o salva PDF/i })
    ).toBeVisible();
  });
});
