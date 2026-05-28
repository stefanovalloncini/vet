import { expect, test } from "@playwright/test";

test.describe("auth entry flow", () => {
  test("the login screen exposes both sign-in affordances under one heading", async ({
    page,
  }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("heading", { level: 1, name: "Entra nel tuo account" })
    ).toBeVisible();
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Invia magic link/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Entra con Google/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Richiedi accesso/i })
    ).toBeVisible();
  });

  test("rejects an invalid email with an inline field error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/Email/i).fill("non-una-email");
    await page.getByRole("button", { name: /Invia magic link/i }).click();
    await expect(
      page.getByText(/Inserisci un indirizzo email valido/i)
    ).toBeVisible();
  });

  // TODO: requires the functions emulator (createSignInTicket on :5001), which the e2e suite does not start (auth+firestore only).
  test.skip("sending a magic link shows the check-your-email confirmation", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel(/Email/i).fill("e2e-magic@example.com");
    await page.getByRole("button", { name: /Invia magic link/i }).click();
    await expect(page.getByText(/Controlla la tua email/i)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("e2e-magic@example.com")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Invia di nuovo/i })
    ).toBeVisible();
  });

  test("the access-request form is reachable and validates required fields", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Richiedi accesso/i }).click();

    await expect(
      page.getByRole("heading", { level: 1, name: /Richiedi accesso/i })
    ).toBeVisible();
    await expect(page.getByLabel(/Nome e cognome/i)).toBeVisible();
    await expect(page.getByLabel(/Motivazione/i)).toBeVisible();

    await page.getByRole("button", { name: /Invia richiesta/i }).click();
    await expect(page.getByText(/Inserisci nome e cognome/i)).toBeVisible();

    await page.getByRole("button", { name: /Indietro/i }).click();
    await expect(
      page.getByRole("button", { name: /Invia magic link/i })
    ).toBeVisible();
  });

  // TODO: requires the functions emulator (createSignInTicket on :5001), which the e2e suite does not start (auth+firestore only).
  test.skip("submitting a valid access request shows the received confirmation", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Richiedi accesso/i }).click();
    await page.getByLabel(/Email/i).fill("e2e-request@example.com");
    await page.getByLabel(/Nome e cognome/i).fill("Mario Rossi");
    await page.getByRole("button", { name: /Invia richiesta/i }).click();
    await expect(page.getByText(/Richiesta inviata per/i)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("e2e-request@example.com")).toBeVisible();
  });

  test("the theme toggle is reachable and keeps a single h1", async ({ page }) => {
    await page.goto("/login");
    const toggle = page.getByRole("button", { name: /Tema/i });
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  });
});

test.describe("not-found page", () => {
  test("an unknown anonymous route shows the not-found screen with a login link", async ({
    page,
  }) => {
    await page.goto("/questa-pagina-non-esiste");
    await expect(
      page.getByRole("heading", { level: 1, name: /Pagina non trovata/i })
    ).toBeVisible();
    await expect(page.getByText("/questa-pagina-non-esiste")).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Torna al login/i })
    ).toHaveAttribute("href", "/login");
  });
});
