import { expect, test } from "./setup/auth";
import { FIXTURE, restoreSeededFixture } from "./setup/seed";

test.describe("aziende detail UI", () => {
  test.beforeEach(async () => {
    await restoreSeededFixture();
  });

  async function openDetail(page: import("@playwright/test").Page) {
    await page.goto("/aziende");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 15_000,
    });
    await page
      .getByRole("link")
      .filter({ hasText: FIXTURE.azienda.nome })
      .first()
      .click();
    await expect(
      page.getByRole("heading", { level: 1, name: FIXTURE.azienda.nome })
    ).toBeVisible({ timeout: 10_000 });
  }

  test("shows the name as the only h1 plus the anagrafica panel", async ({
    signedInVet,
  }) => {
    await openDetail(signedInVet);
    await expect(
      signedInVet.getByRole("heading", { level: 1 })
    ).toHaveCount(1);
    await expect(signedInVet.getByText("Anagrafica")).toBeVisible();
    await expect(signedInVet.getByText("Totale storico")).toBeVisible();
  });

  test("lists the storico tab with the seeded activity total", async ({
    signedInVet,
  }) => {
    await openDetail(signedInVet);
    await expect(
      signedInVet.getByRole("tab", { name: /Storico/ })
    ).toBeVisible();
    await expect(
      signedInVet.getByText(FIXTURE.tipo.nome).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("the back link returns to the aziende list", async ({
    signedInVet,
  }) => {
    await openDetail(signedInVet);
    await signedInVet
      .getByRole("link", { name: "Aziende", exact: true })
      .first()
      .click();
    await expect(signedInVet).toHaveURL(/\/aziende\/?$/, { timeout: 10_000 });
    await expect(
      signedInVet.getByRole("heading", { level: 1, name: "Aziende" })
    ).toBeVisible();
  });

  test("renders the detail without horizontal overflow on a phone", async ({
    signedInVet,
  }) => {
    await signedInVet.setViewportSize({ width: 375, height: 812 });
    await openDetail(signedInVet);
    const overflow = await signedInVet.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth + 1
    );
    expect(overflow).toBe(false);
  });
});
