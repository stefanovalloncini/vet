import { expect, test } from "./setup/auth";

test.describe("keyboard shortcuts", () => {
  test("? opens the shortcuts dialog", async ({ signedInVet }) => {
    await signedInVet.goto("/agenda");
    await expect(signedInVet.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 15_000,
    });
    await signedInVet.keyboard.press("?");
    await expect(
      signedInVet.getByRole("heading", {
        name: /Scorciatoie da tastiera/i,
      })
    ).toBeVisible({ timeout: 5_000 });
  });

  test("the dialog lists the documented shortcuts", async ({ signedInVet }) => {
    await signedInVet.goto("/agenda");
    await expect(signedInVet.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 15_000,
    });
    await signedInVet.keyboard.press("?");
    await expect(
      signedInVet.getByText(/Apri la ricerca rapida/i)
    ).toBeVisible();
    await expect(
      signedInVet.getByText(/Aggiungi una nuova attività/i)
    ).toBeVisible();
    await expect(signedInVet.getByText(/Chiudi dialoghi e popup/i)).toBeVisible();
  });

  test("Cmd+K opens the search palette", async ({ signedInVet }) => {
    await signedInVet.goto("/agenda");
    await expect(signedInVet.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 15_000,
    });
    await signedInVet.keyboard.press("Meta+k");
    // Search palette renders a search input with placeholder "Cerca…" or similar
    await expect(
      signedInVet.getByPlaceholder(/Cerca/i).first()
    ).toBeVisible({ timeout: 5_000 });
  });
});
