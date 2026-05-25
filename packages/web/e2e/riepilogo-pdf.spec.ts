import { expect, test } from "./setup/auth";
import { FIXTURE, restoreSeededFixture } from "./setup/seed";

test.describe("riepilogo PDF (azienda)", () => {
  test.beforeEach(async () => {
    await restoreSeededFixture();
  });

  test("page renders the preview with the seeded attivita", async ({
    signedInVet,
  }) => {
    await signedInVet.goto(
      `/aziende/${FIXTURE.azienda.id}/riepilogo?from=2026-05-01&to=2026-05-31`
    );

    await expect(
      signedInVet.getByRole("heading", { level: 1, name: FIXTURE.azienda.nome })
    ).toBeVisible({ timeout: 15_000 });

    await expect(signedInVet.getByText(FIXTURE.tipo.nome).first()).toBeVisible({
      timeout: 10_000,
    });

    await expect(
      signedInVet.getByRole("button", { name: /Stampa o salva PDF/i })
    ).toBeVisible();
  });

  test("can change period via from/to inputs", async ({ signedInVet }) => {
    await signedInVet.goto(`/aziende/${FIXTURE.azienda.id}/riepilogo`);

    await expect(
      signedInVet.getByRole("heading", { level: 1, name: FIXTURE.azienda.nome })
    ).toBeVisible({ timeout: 15_000 });

    const fromInput = signedInVet.getByLabel(/^Da$/i);
    const toInput = signedInVet.getByLabel(/^A$/i);

    await fromInput.fill("2024-01-01");
    await toInput.fill("2024-01-31");

    await expect(signedInVet).toHaveURL(/from=2024-01-01/);
    await expect(signedInVet).toHaveURL(/to=2024-01-31/);
  });

  test("404 message for an unknown azienda id", async ({ signedInVet }) => {
    await signedInVet.goto("/aziende/does-not-exist/riepilogo");
    await expect(
      signedInVet.getByText(/Cliente non trovato/i)
    ).toBeVisible({ timeout: 10_000 });
  });
});
