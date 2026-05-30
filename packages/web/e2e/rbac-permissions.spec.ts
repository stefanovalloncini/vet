import { initializeApp, deleteApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  updateDoc,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";
import type { Page } from "@playwright/test";
import { expect, primeAuthStorage, test } from "./setup/auth";
import {
  AUTH_EMULATOR_HOST,
  EMULATOR_PROJECT_ID,
  FIRESTORE_EMULATOR_HOST,
  FIXTURE,
  restoreSeededFixture,
  type SeedAccount,
} from "./setup/seed";
import {
  RBAC_IDENTITIES,
  VETB_ATTIVITA_ID,
  seedRbacIdentities,
  seedVetBAttivita,
} from "./setup/rbac-identities";

const BASE_URL = "http://127.0.0.1:5173";
const SHELL = 15_000;

async function signInAs(page: Page, account: SeedAccount): Promise<void> {
  await primeAuthStorage(page, account, BASE_URL);
}

async function landOnShell(page: Page): Promise<void> {
  await page.goto("/");
  await expect(page).not.toHaveURL(/\/login/, { timeout: SHELL });
  await expect(
    page.getByRole("heading", { name: /Account in attesa di approvazione/i })
  ).toBeHidden();
}

/**
 * Direct navigation to a capability-gated route must redirect a user who lacks
 * the cap back to the app root. RequireCapability renders `<Navigate to="/" />`,
 * and HomePage then forwards anyone with `activities.read.all` to `/riepilogo`.
 * So for every role in this suite the guarded route resolves to `/riepilogo`.
 */
async function expectRouteGuardRedirect(
  page: Page,
  path: string
): Promise<void> {
  await page.goto(path);
  await expect(page).toHaveURL(/\/riepilogo$/, { timeout: SHELL });
  await expect(page).not.toHaveURL(new RegExp(`${path}$`));
}

async function expectRouteReachable(
  page: Page,
  path: string,
  heading: RegExp
): Promise<void> {
  await page.goto(path);
  await expect(page).toHaveURL(new RegExp(`${path.replace(/\//g, "\\/")}$`), {
    timeout: SHELL,
  });
  await expect(
    page.getByRole("heading", { level: 1, name: heading })
  ).toBeVisible({ timeout: SHELL });
}

/**
 * Runs `body` with a client-SDK Firestore handle (NOT admin, which bypasses
 * rules) authenticated as `account`, pointed at the emulators. This is the only
 * way to exercise the security rules from the actor's perspective. Each call
 * gets a uniquely-named app so emulator connection is never re-applied.
 */
async function withClientDb(
  account: SeedAccount,
  body: (db: Firestore) => Promise<void>
): Promise<void> {
  const app = initializeApp(
    { apiKey: "fake-emulator-api-key", projectId: EMULATOR_PROJECT_ID },
    `rbac-${account.uid}-${Date.now()}`
  ) as FirebaseApp;
  const auth = getAuth(app);
  connectAuthEmulator(auth, `http://${AUTH_EMULATOR_HOST}`, {
    disableWarnings: true,
  });
  const [host, port] = FIRESTORE_EMULATOR_HOST.split(":");
  const db: Firestore = getFirestore(app);
  connectFirestoreEmulator(db, host ?? "127.0.0.1", Number(port ?? 8080));
  try {
    await signInWithEmailAndPassword(auth, account.email, account.password);
    await body(db);
  } finally {
    await signOut(auth).catch(() => undefined);
    await deleteApp(app).catch(() => undefined);
  }
}

async function attemptSoftDelete(
  db: Firestore,
  attivitaId: string,
  actorUid: string
): Promise<void> {
  await updateDoc(doc(db, "attivita", attivitaId), {
    isDeleted: true,
    deletedAt: serverTimestamp(),
    deletedBy: actorUid,
    updatedAt: serverTimestamp(),
  });
}

function isPermissionDenied(err: unknown): boolean {
  return (
    err instanceof Error &&
    /permission|insufficient|PERMISSION_DENIED/i.test(err.message)
  );
}

test.describe("RBAC: role separation and cross-user safety", () => {
  test.beforeAll(async () => {
    test.setTimeout(60_000);
    await seedRbacIdentities();
  });

  test.beforeEach(async () => {
    await restoreSeededFixture();
    await seedVetBAttivita();
  });

  test.describe("veterinario semplice", () => {
    test("can log an activity and read everyone's activities", async ({
      page,
    }) => {
      await signInAs(page, RBAC_IDENTITIES.semplice);
      await page.goto("/attivita");
      await expect(
        page.getByRole("heading", { level: 1, name: /Attività/i })
      ).toBeVisible({ timeout: SHELL });

      // tutti vedono tutto: vet B's seeded activity shows even though the
      // semplice account does not own it.
      await expect(
        page
          .getByRole("link", { name: new RegExp(FIXTURE.azienda.nome) })
          .first()
      ).toBeVisible({ timeout: SHELL });

      await page.goto("/attivita/nuova");
      await expect(
        page.getByRole("heading", { level: 1, name: /Nuova attività/i })
      ).toBeVisible({ timeout: SHELL });
      await page.getByLabel(/Data/i).fill("2026-05-22");
      await page
        .getByLabel(/Azienda/i, { exact: false })
        .selectOption(FIXTURE.azienda.id);
      await page
        .getByLabel(/Tipo/i, { exact: false })
        .first()
        .selectOption(FIXTURE.tipo.id);
      await page.getByLabel(/Tariffa/i).fill("90");
      await page.getByRole("button", { name: /Salva/i }).click();
      await expect(page).toHaveURL(/\/attivita(\?|$)/, { timeout: SHELL });
    });

    test("cannot emit a conto or mark a saldo (affordances hidden)", async ({
      page,
    }) => {
      await signInAs(page, RBAC_IDENTITIES.semplice);
      await page.goto(`/aziende/${FIXTURE.azienda.id}`);
      await expect(
        page.getByRole("heading", { level: 1, name: FIXTURE.azienda.nome })
      ).toBeVisible({ timeout: SHELL });

      // Proforma is allowed (conti.proforma) but official emit (conti.emit) is not.
      await expect(
        page.getByRole("button", { name: /Salva come pro forma/i })
      ).toBeVisible({ timeout: SHELL });
      await expect(
        page.getByRole("button", { name: /^Emetti conto$/i })
      ).toHaveCount(0);

      // Open the conti tab and confirm no "Segna saldato" action (conti.saldo).
      // The tab's accessible name carries a count badge ("Conti 0"), so match
      // only the label prefix.
      await page.getByRole("tab", { name: /^Conti\b/i }).click();
      await expect(
        page.getByRole("button", { name: /Segna saldato/i })
      ).toHaveCount(0);
    });

    test("admin area is unreachable: nav hidden and direct routes redirect", async ({
      page,
    }) => {
      await signInAs(page, RBAC_IDENTITIES.semplice);
      await landOnShell(page);

      // Desktop sidebar (hidden on mobile breakpoints): no Amministrazione
      // section and no admin links. Skip on viewports where the sidebar is
      // collapsed away entirely.
      const wide = (page.viewportSize()?.width ?? 0) >= 640;
      if (wide) {
        const nav = page.getByRole("navigation", { name: /Navigazione/i });
        await expect(nav).toBeVisible({ timeout: SHELL });
        await expect(
          nav.getByRole("link", { name: /^Audit$/ })
        ).toHaveCount(0);
        await expect(
          nav.getByRole("link", { name: /^Allowlist$/ })
        ).toHaveCount(0);
        await expect(
          nav.getByRole("link", { name: /^Ruoli$/ })
        ).toHaveCount(0);
      }

      // Route guards bounce direct navigation regardless of viewport.
      await expectRouteGuardRedirect(page, "/admin/audit");
      await expectRouteGuardRedirect(page, "/admin/allowlist");
      await expectRouteGuardRedirect(page, "/admin/ruoli");
      await expectRouteGuardRedirect(page, "/admin/stats-vet");
    });
  });

  test.describe("titolare", () => {
    test("can emit a conto and mark it saldato", async ({ page }) => {
      await signInAs(page, RBAC_IDENTITIES.titolare);
      await page.goto(`/aziende/${FIXTURE.azienda.id}`);
      await expect(
        page.getByRole("heading", { level: 1, name: FIXTURE.azienda.nome })
      ).toBeVisible({ timeout: SHELL });

      const fromInput = page.locator('input[type="date"]').first();
      const toInput = page.locator('input[type="date"]').nth(1);
      await fromInput.fill("2026-05-01");
      await toInput.fill("2026-05-31");

      await expect(page.getByText(/Attività:/i).first()).toBeVisible({
        timeout: SHELL,
      });

      await page.getByRole("button", { name: /^Emetti conto$/i }).click();
      await page.getByRole("button", { name: /^Emetti$/i }).click();
      await expect(page.getByText(/Conto emesso/i)).toBeVisible({
        timeout: SHELL,
      });

      // The emitted conto can now be marked saldato (conti.saldo). The tab's
      // accessible name carries a count badge ("Conti 1").
      await page.getByRole("tab", { name: /^Conti\b/i }).click();
      const salda = page.getByRole("button", { name: /Segna saldato/i });
      await expect(salda.first()).toBeVisible({ timeout: SHELL });
      await salda.first().click();
      await expect(page.getByText(/Saldato/i).first()).toBeVisible({
        timeout: SHELL,
      });
    });

    test("still cannot reach audit, allowlist or roles", async ({ page }) => {
      await signInAs(page, RBAC_IDENTITIES.titolare);
      await landOnShell(page);

      const wide = (page.viewportSize()?.width ?? 0) >= 640;
      if (wide) {
        const nav = page.getByRole("navigation", { name: /Navigazione/i });
        await expect(nav.getByRole("link", { name: /^Audit$/ })).toHaveCount(0);
        await expect(
          nav.getByRole("link", { name: /^Allowlist$/ })
        ).toHaveCount(0);
        await expect(nav.getByRole("link", { name: /^Ruoli$/ })).toHaveCount(0);
      }

      await expectRouteGuardRedirect(page, "/admin/audit");
      await expectRouteGuardRedirect(page, "/admin/allowlist");
      await expectRouteGuardRedirect(page, "/admin/ruoli");
    });
  });

  test.describe("amministratore", () => {
    test("reaches audit, allowlist, roles and the approval queue", async ({
      page,
    }) => {
      await signInAs(page, RBAC_IDENTITIES.amministratore);

      await expectRouteReachable(page, "/admin/audit", /Audit log/i);
      await expectRouteReachable(page, "/admin/ruoli", /Ruoli/i);

      // Allowlist + the user-approval queue tab. The pending tab is gated on
      // users.approve; reload once if the primed token has not yet picked up
      // the freshly-seeded claims (emulator claim propagation can lag).
      await page.goto("/admin/allowlist");
      await expect(
        page.getByRole("heading", { level: 1, name: /Allowlist/i })
      ).toBeVisible({ timeout: SHELL });
      const pendingTab = page.getByRole("tab", { name: /Richieste di accesso/i });
      if ((await pendingTab.count()) === 0) {
        await page.reload();
        await expect(
          page.getByRole("heading", { level: 1, name: /Allowlist/i })
        ).toBeVisible({ timeout: SHELL });
      }
      await expect(pendingTab).toBeVisible({ timeout: SHELL });
      await pendingTab.click();

      // The seeded pending user is queued for approval (users.approve view).
      await expect(
        page.getByText(new RegExp(FIXTURE.pending.email, "i")).first()
      ).toBeVisible({ timeout: SHELL });
    });
  });

  test.describe("cross-user integrity", () => {
    test("vet A cannot see a delete affordance on vet B's activity", async ({
      page,
    }) => {
      // FIXTURE.vet stands in as vet A; the editor for vet B's record must not
      // expose the destructive actions (canDelete is gated on ownerUid === uid).
      await signInAs(page, FIXTURE.vet);
      await page.goto(`/attivita/${VETB_ATTIVITA_ID}`);
      await expect(
        page.getByRole("heading", { level: 1, name: /Modifica attività/i })
      ).toBeVisible({ timeout: SHELL });
      await expect(
        page.getByText(new RegExp(RBAC_IDENTITIES.vetB.displayName))
      ).toBeVisible({ timeout: SHELL });
      await expect(
        page.getByRole("button", { name: /^Elimina$/i })
      ).toHaveCount(0);
    });

    test("a forced soft-delete of vet B's activity by vet A is rejected by rules", async () => {
      // The UI hides the action; this asserts the server-side gate. Vet A owns
      // activities.delete.own but not vet B's record, so the rule must deny.
      let denied = false;
      await withClientDb(FIXTURE.vet, async (db) => {
        try {
          await attemptSoftDelete(db, VETB_ATTIVITA_ID, FIXTURE.vet.uid);
        } catch (err) {
          denied = isPermissionDenied(err);
        }
      });
      expect(denied).toBe(true);
    });

    test("vet B can soft-delete its own activity through the rules", async () => {
      // Positive control: the same write succeeds when the actor owns the
      // record, proving the deny above is ownership-driven, not a blanket block.
      let allowed = false;
      await withClientDb(RBAC_IDENTITIES.vetB, async (db) => {
        await attemptSoftDelete(db, VETB_ATTIVITA_ID, RBAC_IDENTITIES.vetB.uid);
        allowed = true;
      });
      expect(allowed).toBe(true);
    });
  });

  test.describe("pending user", () => {
    test("lands on the approval screen and cannot reach data routes", async ({
      signedInPending,
    }) => {
      await signedInPending.goto("/");
      await expect(
        signedInPending.getByRole("heading", {
          name: /Account in attesa di approvazione/i,
        })
      ).toBeVisible({ timeout: SHELL });
      await expect(
        signedInPending.getByRole("button", { name: /Esci/i })
      ).toBeVisible();

      // Every protected data route resolves to the same approval gate.
      for (const path of ["/attivita", "/aziende", "/conti", "/riepilogo"]) {
        await signedInPending.goto(path);
        await expect(
          signedInPending.getByRole("heading", {
            name: /Account in attesa di approvazione/i,
          })
        ).toBeVisible({ timeout: SHELL });
      }
    });
  });
});
