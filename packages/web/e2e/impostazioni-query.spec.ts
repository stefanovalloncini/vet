import { expect, test } from "./setup/auth";

test.describe("impostazioni", () => {
  test("renders the four sections in the new dense layout", async ({
    signedInVet,
  }) => {
    await signedInVet.goto("/impostazioni");
    await expect(
      signedInVet.getByRole("heading", { level: 1, name: /Impostazioni/i })
    ).toBeVisible({ timeout: 15_000 });

    for (const title of ["Account", "Tema", "Cestino", "Backup", "Privacy"]) {
      await expect(
        signedInVet.getByRole("heading", { level: 2, name: title })
      ).toBeVisible();
    }

    const main = signedInVet.getByRole("main");
    await expect(main.getByText("E2E Vet")).toBeVisible();
    await expect(main.getByText("vet.e2e@example.com")).toBeVisible();
  });

  test("edits the retention value through the inline editor", async ({
    signedInVet,
  }) => {
    await signedInVet.goto("/impostazioni");
    await expect(
      signedInVet.getByRole("heading", { level: 1, name: /Impostazioni/i })
    ).toBeVisible({ timeout: 15_000 });

    await expect(signedInVet.getByText("7 giorni")).toBeVisible();
    await signedInVet.getByRole("button", { name: /Modifica/ }).click();

    const input = signedInVet.getByLabel(/Giorni/);
    await expect(input).toBeFocused();
    await input.fill("14");
    await signedInVet.getByRole("button", { name: /^Salva$/ }).click();

    await expect(signedInVet.getByText("14 giorni")).toBeVisible();
    await expect(signedInVet.getByLabel(/Giorni/)).toBeHidden();
  });

  test("cancels an edit without committing", async ({ signedInVet }) => {
    await signedInVet.goto("/impostazioni");
    await expect(
      signedInVet.getByRole("heading", { level: 1, name: /Impostazioni/i })
    ).toBeVisible({ timeout: 15_000 });

    await signedInVet.getByRole("button", { name: /Modifica/ }).click();
    await signedInVet.getByLabel(/Giorni/).fill("21");
    await signedInVet.getByRole("button", { name: /Annulla/ }).click();

    await expect(signedInVet.getByText("7 giorni")).toBeVisible();
    await expect(signedInVet.getByLabel(/Giorni/)).toBeHidden();
  });
});
