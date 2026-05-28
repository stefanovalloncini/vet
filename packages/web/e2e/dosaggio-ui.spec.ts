import { expect, test } from "./setup/auth";

test.describe("dosaggio calculator UI", () => {
  test("renders one heading and the empty result placeholder", async ({
    signedInVet,
  }) => {
    await signedInVet.goto("/strumenti/dosaggio");
    await expect(
      signedInVet.getByRole("heading", {
        level: 1,
        name: /Calcolatore dosaggio/i,
      })
    ).toBeVisible({ timeout: 15_000 });
    await expect(signedInVet.getByText("—")).toBeVisible();
  });

  test("computes ml from weight, dose and concentration", async ({
    signedInVet,
  }) => {
    await signedInVet.goto("/strumenti/dosaggio");
    await expect(
      signedInVet.getByRole("heading", { level: 1 })
    ).toBeVisible({ timeout: 15_000 });

    await signedInVet.getByLabel(/Peso animale/i).fill("600");
    await signedInVet.getByLabel(/Dosaggio/i).fill("1");
    await signedInVet.getByLabel(/Concentrazione/i).fill("50");

    await expect(signedInVet.getByText("12,00")).toBeVisible();
    await expect(signedInVet.getByText("ml")).toBeVisible();
  });

  test("fills dose and concentration from a preset", async ({
    signedInVet,
  }) => {
    await signedInVet.goto("/strumenti/dosaggio");
    await expect(
      signedInVet.getByRole("heading", { level: 1 })
    ).toBeVisible({ timeout: 15_000 });

    await signedInVet.getByLabel(/Preset/i).selectOption("ceftiofur-50");
    await expect(signedInVet.getByLabel(/Concentrazione/i)).toHaveValue("50");
    await expect(signedInVet.getByText("Via")).toBeVisible();
  });

  test("exposes custom stepper buttons on the numeric fields", async ({
    signedInVet,
  }) => {
    await signedInVet.goto("/strumenti/dosaggio");
    await expect(
      signedInVet.getByRole("heading", { level: 1 })
    ).toBeVisible({ timeout: 15_000 });

    await expect(
      signedInVet.getByRole("button", { name: /Aumenta/i }).first()
    ).toBeVisible();
  });
});
