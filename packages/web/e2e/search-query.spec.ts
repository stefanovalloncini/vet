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
});
