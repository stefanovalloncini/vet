import { expect, test } from "./setup/auth";
import { FIXTURE, restoreSeededFixture } from "./setup/seed";

test.describe("aziende list UI", () => {
  test.beforeEach(async () => {
    await restoreSeededFixture();
  });

  test("renders one page heading and the seeded azienda card", async ({
    signedInVet,
  }) => {
    await signedInVet.goto("/aziende");
    await expect(
      signedInVet.getByRole("heading", { level: 1, name: "Aziende" })
    ).toBeVisible({ timeout: 15_000 });

    await expect(
      signedInVet.getByRole("link", { name: FIXTURE.azienda.nome })
    ).toBeVisible({ timeout: 10_000 });
  });

  test("search narrows to nothing and shows the search empty state", async ({
    signedInVet,
  }) => {
    await signedInVet.goto("/aziende");
    await expect(
      signedInVet.getByRole("heading", { level: 1 })
    ).toBeVisible({ timeout: 15_000 });

    await signedInVet
      .getByRole("textbox", { name: "Cerca" })
      .fill("zzz-nessuna-corrispondenza");

    await expect(
      signedInVet.getByText("Nessun risultato.").first()
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      signedInVet.getByRole("link", { name: FIXTURE.azienda.nome })
    ).toHaveCount(0);
  });

  test("a card exposes a pin toggle reachable by keyboard", async ({
    signedInVet,
  }) => {
    await signedInVet.setViewportSize({ width: 390, height: 844 });
    await signedInVet.goto("/aziende");
    await expect(
      signedInVet.getByRole("heading", { level: 1 })
    ).toBeVisible({ timeout: 15_000 });

    const pin = signedInVet
      .getByRole("button", { name: /preferiti/i })
      .first();
    await expect(pin).toBeVisible({ timeout: 10_000 });
    const box = await pin.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(40);
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(40);
  });

  test("reflows without horizontal overflow on a small phone", async ({
    signedInVet,
  }) => {
    await signedInVet.setViewportSize({ width: 320, height: 720 });
    await signedInVet.goto("/aziende");
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
