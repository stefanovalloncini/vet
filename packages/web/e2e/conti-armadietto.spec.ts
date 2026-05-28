import { expect, test } from "./setup/auth";
import { FIXTURE, restoreSeededFixture } from "./setup/seed";

async function setCanone(
  page: import("@playwright/test").Page,
  value: string
): Promise<void> {
  await page.goto(`/aziende/${FIXTURE.azienda.id}/modifica`);
  await expect(
    page.getByRole("heading", { level: 1, name: /Modifica azienda/i })
  ).toBeVisible({ timeout: 15_000 });
  await page
    .getByLabel(/Armadietto farmaci/i)
    .fill(value);
  await page.getByRole("button", { name: /^Salva$/i }).click();
  await expect(page).toHaveURL(/\/aziende\/?$/, { timeout: 15_000 });
}

async function openConto(
  page: import("@playwright/test").Page
): Promise<void> {
  await page.goto(`/aziende/${FIXTURE.azienda.id}`);
  await expect(
    page.getByRole("heading", { level: 1, name: FIXTURE.azienda.nome })
  ).toBeVisible({ timeout: 15_000 });
}

async function setPeriod(
  page: import("@playwright/test").Page,
  from: string,
  to: string
): Promise<void> {
  await page.getByRole("tab", { name: /Personalizzato/i }).click();
  await page.getByLabel(/^Da$/i).fill(from);
  await page.getByLabel(/^A$/i).fill(to);
}

test.describe("conti armadietto farmaci", () => {
  test.beforeEach(async () => {
    await restoreSeededFixture();
  });

  test("canone round-trips through the edit form", async ({ signedInVet }) => {
    await setCanone(signedInVet, "800");
    await signedInVet.goto(`/aziende/${FIXTURE.azienda.id}/modifica`);
    await expect(signedInVet.getByLabel(/Armadietto farmaci/i)).toHaveValue(
      "800",
      { timeout: 15_000 }
    );
  });

  test("emit panel shows a pre-checked armadietto row with prorated default", async ({
    signedInVet,
  }) => {
    await setCanone(signedInVet, "800");
    await openConto(signedInVet);
    await setPeriod(signedInVet, "2026-04-01", "2026-06-30");

    const toggle = signedInVet.getByRole("checkbox", {
      name: /Armadietto farmaci/i,
    });
    await expect(toggle).toBeChecked();
    // 800 * 3/12 = 200
    await expect(signedInVet.getByLabel("Importo (€)")).toHaveValue("200");
    // activity 80 + armadietto 200 = 280
    await expect(signedInVet.getByText(/280,00/)).toBeVisible();
  });

  test("toggling the armadietto off drops it from the total", async ({
    signedInVet,
  }) => {
    await setCanone(signedInVet, "800");
    await openConto(signedInVet);
    await setPeriod(signedInVet, "2026-04-01", "2026-06-30");

    await signedInVet
      .getByText("Armadietto farmaci", { exact: true })
      .click();
    await expect(
      signedInVet.getByRole("checkbox", { name: /Armadietto farmaci/i })
    ).not.toBeChecked();
    await expect(signedInVet.getByText(/Attività:\s*1/)).toBeVisible();
    await expect(signedInVet.getByText(/80,00/).first()).toBeVisible();
  });

  test("an armadietto-only proforma can be saved for a period with no activities", async ({
    signedInVet,
  }) => {
    await setCanone(signedInVet, "800");
    await openConto(signedInVet);
    // Q1 2026 has no seeded activity (the only one is 2026-05-15).
    await setPeriod(signedInVet, "2026-01-01", "2026-03-31");

    await expect(
      signedInVet.getByRole("checkbox", { name: /Armadietto farmaci/i })
    ).toBeChecked();
    await expect(
      signedInVet.getByText("200,00 €", { exact: true })
    ).toBeVisible();

    const proforma = signedInVet.getByRole("button", {
      name: /Salva come pro forma/i,
    });
    await expect(proforma).toBeEnabled();
    await proforma.click();
    await expect(signedInVet.getByText(/Pro forma generato/i)).toBeVisible({
      timeout: 15_000,
    });
  });

  test("an azienda without a canone shows no armadietto row", async ({
    signedInVet,
  }) => {
    await openConto(signedInVet);
    await setPeriod(signedInVet, "2026-04-01", "2026-06-30");
    await expect(
      signedInVet.getByRole("checkbox", { name: /Armadietto farmaci/i })
    ).toHaveCount(0);
  });
});
