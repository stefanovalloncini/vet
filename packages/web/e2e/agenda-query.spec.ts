import { expect, test } from "./setup/auth";

test.describe("agenda (tanstack query)", () => {
  test("renders the agenda page with calendar and day list", async ({
    signedInVet,
  }) => {
    await signedInVet.goto("/agenda");
    await expect(signedInVet.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      signedInVet.getByRole("button", { name: /Oggi/i })
    ).toBeVisible();
  });

  test("navigates between months without breaking the calendar grid", async ({
    signedInVet,
  }) => {
    await signedInVet.goto("/agenda");
    await expect(signedInVet.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 15_000,
    });
    await signedInVet
      .getByRole("button", { name: /Settimana precedente/i })
      .click();
    await signedInVet.getByRole("button", { name: /Oggi/i }).click();
    await expect(signedInVet.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("today button restores the current week", async ({ signedInVet }) => {
    await signedInVet.goto("/agenda");
    await expect(signedInVet.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 15_000,
    });
    const today = new Date();
    const todayLabel = String(today.getDate());
    await signedInVet
      .getByRole("button", { name: /Settimana successiva/i })
      .click();
    await signedInVet
      .getByRole("button", { name: /Settimana successiva/i })
      .click();
    await signedInVet.getByRole("button", { name: /^Oggi$/i }).click();
    const todayDay = signedInVet
      .getByRole("radio", { checked: true })
      .filter({ hasText: todayLabel });
    await expect(todayDay).toBeVisible({ timeout: 5_000 });
  });
});
