import { expect, test } from "./setup/auth";
import { FIXTURE, restoreSeededFixture } from "./setup/seed";

test.describe("aziende form UI", () => {
  test.beforeEach(async () => {
    await restoreSeededFixture();
  });

  test("groups fields under Anagrafica and Fatturazione with one h1", async ({
    signedInVet,
  }) => {
    await signedInVet.goto("/aziende/nuova");
    await expect(
      signedInVet.getByRole("heading", { level: 1, name: /Nuova azienda/i })
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      signedInVet.getByRole("heading", { level: 1 })
    ).toHaveCount(1);
    await expect(signedInVet.getByText("Anagrafica")).toBeVisible();
    await expect(signedInVet.getByText("Fatturazione")).toBeVisible();
  });

  test("keeps the armadietto farmaci field and its yearly-fee hint", async ({
    signedInVet,
  }) => {
    await signedInVet.goto("/aziende/nuova");
    await expect(
      signedInVet.getByLabel(/Armadietto farmaci/i)
    ).toBeVisible({ timeout: 15_000 });
    await expect(signedInVet.getByText(/Canone annuo concordato/i)).toBeVisible();
  });

  test("Annulla returns to the list without creating anything", async ({
    signedInVet,
  }) => {
    await signedInVet.goto("/aziende/nuova");
    await signedInVet
      .getByLabel(/Nome/i, { exact: false })
      .first()
      .fill("Bozza da scartare");
    await signedInVet.getByRole("button", { name: /Annulla/i }).click();
    await expect(signedInVet).toHaveURL(/\/aziende\/?$/, { timeout: 10_000 });
    await expect(
      signedInVet.getByRole("link").filter({ hasText: "Bozza da scartare" })
    ).toHaveCount(0);
  });

  test("edit mode hydrates the armadietto field for the seeded azienda", async ({
    signedInVet,
  }) => {
    await signedInVet.goto(`/aziende/${FIXTURE.azienda.id}/modifica`);
    await expect(
      signedInVet.getByLabel(/Nome/i, { exact: false }).first()
    ).toHaveValue(FIXTURE.azienda.nome, { timeout: 10_000 });
    await expect(
      signedInVet.getByLabel(/Armadietto farmaci/i)
    ).toBeVisible();
  });

  test("renders the form without horizontal overflow on a small phone", async ({
    signedInVet,
  }) => {
    await signedInVet.setViewportSize({ width: 320, height: 720 });
    await signedInVet.goto("/aziende/nuova");
    await expect(
      signedInVet.getByRole("heading", { level: 1 })
    ).toBeVisible({ timeout: 15_000 });
    const overflow = await signedInVet.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth + 1
    );
    expect(overflow).toBe(false);
  });
});
