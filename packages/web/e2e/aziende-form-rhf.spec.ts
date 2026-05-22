import { expect, test } from "./setup/auth";
import { FIXTURE } from "./setup/seed";

test.describe("aziende form (react-hook-form)", () => {
  test("validates required nome via the schema before hitting the network", async ({
    signedInVet,
  }) => {
    await signedInVet.goto("/aziende/nuova");
    await expect(signedInVet.getByRole("heading", { level: 1 })).toBeVisible();
    await signedInVet.getByRole("button", { name: /Salva/i }).click();
    await expect(signedInVet.getByText(/obbligatorio/i)).toBeVisible({
      timeout: 5_000,
    });
    await expect(signedInVet).toHaveURL(/\/aziende\/nuova$/);
  });

  test("rejects an invalid partita iva at the field level", async ({
    signedInVet,
  }) => {
    await signedInVet.goto("/aziende/nuova");
    const nome = `RHF Stalla ${Date.now().toString().slice(-6)}`;
    await signedInVet.getByLabel(/Nome/i, { exact: false }).first().fill(nome);
    await signedInVet.getByLabel(/Partita IVA/i).fill("00000000000");
    await signedInVet.getByRole("button", { name: /Salva/i }).click();
    await expect(
      signedInVet.getByText(/Partita IVA non valida/i)
    ).toBeVisible({ timeout: 5_000 });
  });

  test("creates an azienda and returns to the list", async ({ signedInVet }) => {
    const unique = `RHF Cascina ${Date.now().toString().slice(-6)}`;
    await signedInVet.goto("/aziende/nuova");
    await signedInVet.getByLabel(/Nome/i, { exact: false }).first().fill(unique);
    await signedInVet
      .getByLabel(/Indirizzo/i)
      .fill("Via dei Campi 12, 26100 Cremona");
    await signedInVet.getByLabel(/Telefono/i).fill("0372123456");
    await signedInVet.getByRole("button", { name: /Salva/i }).click();
    await expect(signedInVet).toHaveURL(/\/aziende(\/|$)/, { timeout: 15_000 });
    await expect(
      signedInVet.getByRole("link", { name: new RegExp(unique) })
    ).toBeVisible({ timeout: 10_000 });
  });

  test("hydrates and updates an existing azienda in edit mode", async ({
    signedInVet,
  }) => {
    await signedInVet.goto(`/aziende/${FIXTURE.azienda.id}/modifica`);
    const nomeField = signedInVet.getByLabel(/Nome/i, { exact: false }).first();
    await expect(nomeField).toHaveValue(FIXTURE.azienda.nome, { timeout: 10_000 });
    const updated = `${FIXTURE.azienda.nome} (rhf)`;
    await nomeField.fill(updated);
    await signedInVet.getByRole("button", { name: /Salva/i }).click();
    await expect(signedInVet).toHaveURL(/\/aziende(\/|$)/, { timeout: 15_000 });
    await expect(
      signedInVet.getByRole("link", { name: new RegExp(updated) })
    ).toBeVisible({ timeout: 10_000 });
  });
});
