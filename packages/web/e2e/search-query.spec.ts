import { expect, test } from "./setup/auth";
import { FIXTURE } from "./setup/seed";

test.describe("search palette", () => {
  test("vet opens palette with ⌘K, searches and navigates to azienda", async ({
    signedInVet,
  }) => {
    await signedInVet.goto("/");
    await expect(signedInVet.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 15_000,
    });

    await signedInVet.keyboard.press("Meta+k");

    const searchInput = signedInVet.getByPlaceholder(/Cerca un'azienda/i);
    await expect(searchInput).toBeVisible({ timeout: 10_000 });

    await searchInput.fill(FIXTURE.azienda.nome.slice(0, 6));

    const result = signedInVet.getByRole("button", {
      name: new RegExp(FIXTURE.azienda.nome),
    });
    await expect(result.first()).toBeVisible({ timeout: 10_000 });

    await result.first().click();

    await expect(signedInVet).toHaveURL(
      new RegExp(`/aziende/${FIXTURE.azienda.id}`),
      { timeout: 10_000 }
    );
    await expect(
      signedInVet.getByRole("heading", {
        level: 1,
        name: FIXTURE.azienda.nome,
      })
    ).toBeVisible({ timeout: 10_000 });
  });

  test("palette exposes dialog and listbox roles and closes on Escape", async ({
    signedInVet,
  }) => {
    await signedInVet.goto("/");
    await expect(signedInVet.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 15_000,
    });

    await signedInVet.keyboard.press("Meta+k");

    const dialog = signedInVet.getByRole("dialog", { name: /Cerca/i });
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    const combobox = signedInVet.getByRole("combobox", { name: /Cerca/i });
    await expect(combobox).toBeFocused();
    await combobox.fill(FIXTURE.azienda.nome.slice(0, 6));

    await expect(signedInVet.getByRole("listbox")).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      signedInVet.getByRole("option").first()
    ).toBeVisible();

    await signedInVet.keyboard.press("Escape");
    await expect(dialog).toBeHidden({ timeout: 10_000 });

    await signedInVet.keyboard.press("Meta+k");
    await expect(
      signedInVet.getByRole("combobox", { name: /Cerca/i })
    ).toHaveValue("", { timeout: 10_000 });
  });
});
