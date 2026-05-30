import { getApps, initializeApp, type App } from "firebase-admin/app";
import {
  getFirestore,
  FieldValue,
  Timestamp,
  type Firestore,
} from "firebase-admin/firestore";
import { capCode } from "@vet/shared";
import { expect, test } from "../setup/auth";
import {
  AUTH_EMULATOR_HOST,
  EMULATOR_PROJECT_ID,
  FIRESTORE_EMULATOR_HOST,
  FIXTURE,
} from "../setup/seed";

/**
 * Conti period, cadence, and double-billing safety.
 *
 * This scenario seeds its own azienda / attivita / conti via the admin SDK so it
 * is independent of the shared fixture, then drives the UI as admin (who holds
 * conti.proforma + conti.emit + conti.saldo).
 *
 * Several assertions encode the coordinator's IN-FLIGHT changes and are marked
 * with [IN-FLIGHT] + test.fixme so they parse and list but stay disabled until
 * the calendar-cadence / already-billed-exclusion work lands on main:
 *   - a fresh riepilogo EXCLUDES activities already covered by an emesso conto
 *     (today main only WARNS, it still counts them);
 *   - the default period for a new conto is anchored to the day AFTER the last
 *     emitted conto's period end (today main always uses the calendar default).
 */

const AZIENDA_ID = "e2e-cadence-azienda";
const AZIENDA_NOME = "Allevamento Cadenza";
const TIPO_ID = FIXTURE.tipo.id;
const TIPO_NOME = FIXTURE.tipo.nome;

const FAKE_API_KEY = "fake-emulator-api-key";

const Q1_FROM = new Date("2026-01-01T00:00:00.000Z");
const Q1_TO = new Date("2026-03-31T23:59:59.999Z");

interface SeedAttivita {
  id: string;
  iso: string;
  totale: number;
}

const Q1_ATTIVITA: ReadonlyArray<SeedAttivita> = [
  { id: "cad-q1-a", iso: "2026-01-20T09:00:00.000Z", totale: 100 },
  { id: "cad-q1-b", iso: "2026-02-18T09:00:00.000Z", totale: 150 },
  { id: "cad-q1-c", iso: "2026-03-10T09:00:00.000Z", totale: 200 },
];
const Q1_IDS = Q1_ATTIVITA.map((a) => a.id);
const Q1_TOTAL = 450;

const Q2_ATTIVITA: ReadonlyArray<SeedAttivita> = [
  { id: "cad-q2-a", iso: "2026-04-08T09:00:00.000Z", totale: 90 },
  { id: "cad-q2-b", iso: "2026-05-22T09:00:00.000Z", totale: 110 },
];
const Q2_IDS = Q2_ATTIVITA.map((a) => a.id);
const Q2_TOTAL = 200;

function adminApp(): App {
  process.env["FIREBASE_AUTH_EMULATOR_HOST"] = AUTH_EMULATOR_HOST;
  process.env["FIRESTORE_EMULATOR_HOST"] = FIRESTORE_EMULATOR_HOST;
  const existing = getApps().find((a) => a.name === "[DEFAULT]");
  if (existing) return existing;
  return initializeApp({ projectId: EMULATOR_PROJECT_ID });
}

async function wipeDoc(db: Firestore, coll: string, id: string): Promise<void> {
  await db.collection(coll).doc(id).delete();
}

async function wipeCadenceDocs(db: Firestore): Promise<void> {
  const conti = await db
    .collection("conti")
    .where("aziendaId", "==", AZIENDA_ID)
    .get();
  const batch = db.batch();
  for (const d of conti.docs) batch.delete(d.ref);
  await batch.commit();
  await wipeDoc(db, "aziende", AZIENDA_ID);
  for (const a of [...Q1_ATTIVITA, ...Q2_ATTIVITA]) {
    await wipeDoc(db, "attivita", a.id);
  }
}

async function seedAzienda(db: Firestore): Promise<void> {
  await db.collection("aziende").doc(AZIENDA_ID).set({
    nome: AZIENDA_NOME,
    nomeNorm: AZIENDA_NOME.toLowerCase(),
    cadenzaFatturazione: "quarterly",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    createdBy: FIXTURE.admin.uid,
    updatedBy: FIXTURE.admin.uid,
    createdByName: FIXTURE.admin.displayName,
    updatedByName: FIXTURE.admin.displayName,
    isDeleted: false,
    schemaVersion: 1,
  });
}

async function seedAttivita(db: Firestore): Promise<void> {
  for (const a of [...Q1_ATTIVITA, ...Q2_ATTIVITA]) {
    await db
      .collection("attivita")
      .doc(a.id)
      .set({
        data: new Date(a.iso),
        aziendaId: AZIENDA_ID,
        aziendaNome: AZIENDA_NOME,
        tipoId: TIPO_ID,
        tipoNome: TIPO_NOME,
        oraria: false,
        adElemento: false,
        tariffa: a.totale,
        totale: a.totale,
        ownerUid: FIXTURE.vet.uid,
        ownerEmail: FIXTURE.vet.email,
        ownerName: FIXTURE.vet.displayName,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        isDeleted: false,
        schemaVersion: 1,
      });
  }
}

interface SeedContoOpts {
  id: string;
  modalita: "proforma" | "emesso";
  periodoFrom: Date;
  periodoTo: Date;
  attivitaIds: ReadonlyArray<string>;
  totaleConto: number;
  saldato?: boolean;
  isDeleted?: boolean;
  emittedAt?: Date;
}

async function seedConto(db: Firestore, o: SeedContoOpts): Promise<void> {
  await db
    .collection("conti")
    .doc(o.id)
    .set({
      aziendaId: AZIENDA_ID,
      aziendaNome: AZIENDA_NOME,
      periodoFrom: Timestamp.fromDate(o.periodoFrom),
      periodoTo: Timestamp.fromDate(o.periodoTo),
      attivitaIds: [...o.attivitaIds],
      totaleConto: o.totaleConto,
      modalita: o.modalita,
      saldato: o.saldato ?? false,
      emittedAt: Timestamp.fromDate(o.emittedAt ?? o.periodoTo),
      emittedBy: FIXTURE.admin.uid,
      emittedByName: FIXTURE.admin.displayName,
      isDeleted: o.isDeleted ?? false,
      schemaVersion: 1,
    });
}

async function getAdminIdToken(): Promise<string> {
  const url = `http://${AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FAKE_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: FIXTURE.admin.email,
      password: FIXTURE.admin.password,
      returnSecureToken: true,
    }),
  });
  if (!res.ok) {
    throw new Error(`admin sign-in failed: ${res.status} ${await res.text()}`);
  }
  const body = (await res.json()) as { idToken: string };
  return body.idToken;
}

/**
 * Attempts a `salda` (mark-paid) write through the Firestore emulator REST
 * commit endpoint as the admin user, so the real security rule decides. Returns
 * the HTTP status: ~200 when the rule allows it, 4xx (403/400) when it denies.
 * Uses a REQUEST_TIME transform for saldatoAt to satisfy isServerStamped.
 */
async function attemptSaldoViaRules(
  idToken: string,
  contoId: string
): Promise<number> {
  const docPath = `projects/${EMULATOR_PROJECT_ID}/databases/(default)/documents/conti/${contoId}`;
  const url = `http://${FIRESTORE_EMULATOR_HOST}/v1/projects/${EMULATOR_PROJECT_ID}/databases/(default)/documents:commit`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      writes: [
        {
          update: {
            name: docPath,
            fields: {
              saldato: { booleanValue: true },
              saldatoBy: { stringValue: FIXTURE.admin.uid },
              saldatoByName: { stringValue: FIXTURE.admin.displayName },
            },
          },
          updateMask: { fieldPaths: ["saldato", "saldatoBy", "saldatoByName"] },
          updateTransforms: [
            { fieldPath: "saldatoAt", setToServerValue: "REQUEST_TIME" },
          ],
        },
      ],
    }),
  });
  return res.status;
}

async function openAzienda(page: import("@playwright/test").Page): Promise<void> {
  await page.goto(`/aziende/${AZIENDA_ID}`);
  await expect(
    page.getByRole("heading", { level: 1, name: AZIENDA_NOME })
  ).toBeVisible({ timeout: 15_000 });
}

async function pickCustomPeriod(
  page: import("@playwright/test").Page,
  from: string,
  to: string
): Promise<void> {
  await page.getByRole("tab", { name: /Personalizzato/i }).click();
  await page.getByLabel(/^Da$/i).fill(from);
  await page.getByLabel(/^A$/i).fill(to);
}

test.describe("conti cadence + no double-billing", () => {
  let db: Firestore;

  test.beforeAll(() => {
    db = getFirestore(adminApp());
  });

  test.beforeEach(async () => {
    await wipeCadenceDocs(db);
    await seedAzienda(db);
    await seedAttivita(db);
  });

  test.afterEach(async () => {
    await wipeCadenceDocs(db);
  });

  test("Q1 emesso conto: Q1 is billed, a fresh preview keeps Q2 billable", async ({
    signedInAdmin,
  }) => {
    await seedConto(db, {
      id: "cad-conto-q1",
      modalita: "emesso",
      periodoFrom: Q1_FROM,
      periodoTo: Q1_TO,
      attivitaIds: Q1_IDS,
      totaleConto: Q1_TOTAL,
      emittedAt: new Date("2026-04-02T10:00:00.000Z"),
    });

    await openAzienda(signedInAdmin);

    // A Q1 re-selection surfaces the already-billed warning (current main).
    await pickCustomPeriod(signedInAdmin, "2026-01-01", "2026-03-31");
    await expect(
      signedInAdmin.getByText(/in un conto già emesso/i)
    ).toBeVisible({ timeout: 10_000 });

    // Q2 stays fully billable: 2 activities, €200, no already-billed warning.
    await pickCustomPeriod(signedInAdmin, "2026-04-01", "2026-06-30");
    await expect(signedInAdmin.getByText(/Attività:\s*2/)).toBeVisible({
      timeout: 10_000,
    });
    await expect(signedInAdmin.getByText(/200,00/).first()).toBeVisible();
    await expect(
      signedInAdmin.getByText(/in un conto già emesso/i)
    ).toHaveCount(0);
  });

  // [IN-FLIGHT] coordinator: a fresh riepilogo must EXCLUDE already-billed
  // activities (no double-billing). Today main still COUNTS them and only warns.
  test.fixme(
    "[IN-FLIGHT] re-selecting Q1 after emit excludes the billed activities from the preview",
    async ({ signedInAdmin }) => {
      await seedConto(db, {
        id: "cad-conto-q1",
        modalita: "emesso",
        periodoFrom: Q1_FROM,
        periodoTo: Q1_TO,
        attivitaIds: Q1_IDS,
        totaleConto: Q1_TOTAL,
        emittedAt: new Date("2026-04-02T10:00:00.000Z"),
      });
      await openAzienda(signedInAdmin);
      await pickCustomPeriod(signedInAdmin, "2026-01-01", "2026-03-31");

      // INTENDED: the 3 billed Q1 activities drop out → empty preview, €0.
      await expect(
        signedInAdmin.getByText(/Nessuna attività nel periodo scelto/i)
      ).toBeVisible({ timeout: 10_000 });
      await expect(
        signedInAdmin.getByRole("button", { name: /^Emetti conto$/i })
      ).toBeDisabled();
    }
  );

  // [IN-FLIGHT] coordinator: with "now" inside a freshly-closed quarter and an
  // unbilled prior quarter, Pagamenti must flag the azienda as "Da emettere".
  test.fixme(
    "[IN-FLIGHT] just-closed calendar quarter with unbilled activity flags 'Da emettere'",
    async ({ signedInAdmin }) => {
      // No conto yet; "now" sits just after Q1 closed.
      await signedInAdmin.clock.install({
        time: new Date("2026-04-05T08:00:00.000Z"),
      });
      await signedInAdmin.goto("/pagamenti");
      await expect(
        signedInAdmin.getByRole("heading", { level: 1, name: /Pagamenti/i })
      ).toBeVisible({ timeout: 15_000 });
      const row = signedInAdmin
        .getByRole("link")
        .filter({ hasText: AZIENDA_NOME });
      await expect(row.first()).toBeVisible({ timeout: 10_000 });
      await expect(
        signedInAdmin.getByText(/Da emettere/i).first()
      ).toBeVisible({ timeout: 10_000 });
    }
  );

  test("default period anchors to the calendar quarter just closed (clock-driven)", async ({
    signedInAdmin,
  }) => {
    // Pin "now" to early Q2 2026 so the cadence default = previous quarter (Q1).
    await signedInAdmin.clock.install({
      time: new Date("2026-04-10T08:00:00.000Z"),
    });
    await openAzienda(signedInAdmin);

    // The quarterly cadence default pre-fills Da/A with the Q1 2026 range.
    await expect(signedInAdmin.getByLabel(/^Da$/i)).toHaveValue("2026-01-01", {
      timeout: 10_000,
    });
    await expect(signedInAdmin.getByLabel(/^A$/i)).toHaveValue("2026-03-31");
  });

  // [IN-FLIGHT] coordinator: the new-conto default should anchor to the day
  // AFTER the last emitted conto's period end, not just the calendar default.
  test.fixme(
    "[IN-FLIGHT] default 'Da' anchors to the day after the last emitted conto period end",
    async ({ signedInAdmin }) => {
      // Last emesso conto covered Q1 (ends 2026-03-31). With "now" pinned far
      // ahead, the calendar default would skip Q2; the anchored default must
      // start the day after the last period end: 2026-04-01.
      await seedConto(db, {
        id: "cad-conto-q1",
        modalita: "emesso",
        periodoFrom: Q1_FROM,
        periodoTo: Q1_TO,
        attivitaIds: Q1_IDS,
        totaleConto: Q1_TOTAL,
        emittedAt: new Date("2026-04-02T10:00:00.000Z"),
      });
      await signedInAdmin.clock.install({
        time: new Date("2026-09-15T08:00:00.000Z"),
      });
      await openAzienda(signedInAdmin);
      await expect(signedInAdmin.getByLabel(/^Da$/i)).toHaveValue("2026-04-01", {
        timeout: 10_000,
      });
    }
  );

  test("a pro-forma is NOT payable in Pagamenti; an emesso conto IS", async ({
    signedInAdmin,
  }) => {
    // Pro-forma covering Q1 — must not register as an unsettled payable.
    await seedConto(db, {
      id: "cad-proforma-q1",
      modalita: "proforma",
      periodoFrom: Q1_FROM,
      periodoTo: Q1_TO,
      attivitaIds: Q1_IDS,
      totaleConto: Q1_TOTAL,
      emittedAt: new Date("2026-04-02T10:00:00.000Z"),
    });

    await signedInAdmin.goto("/pagamenti");
    await expect(
      signedInAdmin.getByRole("heading", { level: 1, name: /Pagamenti/i })
    ).toBeVisible({ timeout: 15_000 });

    const onlyUnpaid = signedInAdmin.getByLabel("Stato");
    await onlyUnpaid.selectOption("unpaid");
    // With only a pro-forma, the azienda is not in the "non saldati" view.
    await expect(
      signedInAdmin.getByRole("link").filter({ hasText: AZIENDA_NOME })
    ).toHaveCount(0, { timeout: 10_000 });

    // Now add an emesso, unsettled conto for Q2 → it becomes payable.
    await seedConto(db, {
      id: "cad-conto-q2",
      modalita: "emesso",
      periodoFrom: new Date("2026-04-01T00:00:00.000Z"),
      periodoTo: new Date("2026-06-30T23:59:59.999Z"),
      attivitaIds: Q2_IDS,
      totaleConto: Q2_TOTAL,
      emittedAt: new Date("2026-07-02T10:00:00.000Z"),
    });

    await signedInAdmin.reload();
    await signedInAdmin.getByLabel("Stato").selectOption("unpaid");
    await expect(
      signedInAdmin
        .getByRole("link")
        .filter({ hasText: AZIENDA_NOME })
        .first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("annulled conto cannot be marked saldato (saldo requires isDeleted==false)", async ({
    signedInAdmin,
  }) => {
    // A control conto (live, emesso, unsettled) and the annulled one.
    await seedConto(db, {
      id: "cad-conto-live",
      modalita: "emesso",
      periodoFrom: new Date("2026-04-01T00:00:00.000Z"),
      periodoTo: new Date("2026-06-30T23:59:59.999Z"),
      attivitaIds: Q2_IDS,
      totaleConto: Q2_TOTAL,
      emittedAt: new Date("2026-07-02T10:00:00.000Z"),
    });
    await seedConto(db, {
      id: "cad-conto-annulled",
      modalita: "emesso",
      periodoFrom: Q1_FROM,
      periodoTo: Q1_TO,
      attivitaIds: Q1_IDS,
      totaleConto: Q1_TOTAL,
      isDeleted: true,
      emittedAt: new Date("2026-04-02T10:00:00.000Z"),
    });

    expect(capCode("conti.saldo")).toBe("cs");
    const idToken = await getAdminIdToken();

    // Security invariant: the rule must reject saldo on an annulled conto.
    const deniedStatus = await attemptSaldoViaRules(
      idToken,
      "cad-conto-annulled"
    );
    expect(deniedStatus).toBeGreaterThanOrEqual(400);

    const annulled = await db
      .collection("conti")
      .doc("cad-conto-annulled")
      .get();
    expect(annulled.get("saldato")).toBe(false);

    // Control: the same write on a live emesso conto is accepted by the rule.
    const okStatus = await attemptSaldoViaRules(idToken, "cad-conto-live");
    expect(okStatus).toBeLessThan(300);
    const live = await db.collection("conti").doc("cad-conto-live").get();
    expect(live.get("saldato")).toBe(true);

    // UI: the annulled conto never surfaces in the per-azienda storico. Only
    // the live conto remains, now marked Saldato; the annulled one is hidden.
    await openAzienda(signedInAdmin);
    await signedInAdmin.getByRole("tab", { name: /Conti/i }).click();
    await expect(signedInAdmin.getByText(/Saldato/i).first()).toBeVisible({
      timeout: 10_000,
    });
    // The annulled conto is the only Non saldato candidate; it must be absent.
    await expect(signedInAdmin.getByText(/Non saldato/i)).toHaveCount(0);
  });

  test("per-azienda storico lists emesso conti with saldato/non-saldato state and filters", async ({
    signedInAdmin,
  }) => {
    await seedConto(db, {
      id: "cad-conto-paid",
      modalita: "emesso",
      periodoFrom: Q1_FROM,
      periodoTo: Q1_TO,
      attivitaIds: Q1_IDS,
      totaleConto: Q1_TOTAL,
      saldato: true,
      emittedAt: new Date("2026-04-02T10:00:00.000Z"),
    });
    await seedConto(db, {
      id: "cad-conto-unpaid",
      modalita: "emesso",
      periodoFrom: new Date("2026-04-01T00:00:00.000Z"),
      periodoTo: new Date("2026-06-30T23:59:59.999Z"),
      attivitaIds: Q2_IDS,
      totaleConto: Q2_TOTAL,
      saldato: false,
      emittedAt: new Date("2026-07-02T10:00:00.000Z"),
    });

    // The azienda surfaces on /pagamenti as "Non saldato" (it has an open conto).
    await signedInAdmin.goto("/pagamenti");
    await expect(
      signedInAdmin.getByRole("heading", { level: 1, name: /Pagamenti/i })
    ).toBeVisible({ timeout: 15_000 });
    const aziendaLink = signedInAdmin
      .getByRole("link")
      .filter({ hasText: AZIENDA_NOME });
    await expect(aziendaLink.first()).toBeVisible({ timeout: 10_000 });

    // Page-level stato filter: "Solo non saldati" keeps it, "Saldato" hides it.
    const statoFilter = signedInAdmin.getByLabel("Stato");
    await statoFilter.selectOption("unpaid");
    await expect(aziendaLink.first()).toBeVisible({ timeout: 10_000 });
    await statoFilter.selectOption("ok");
    await expect(aziendaLink).toHaveCount(0, { timeout: 10_000 });

    // The detail page's Conti tab shows both saldato and non-saldato states.
    await openAzienda(signedInAdmin);
    await signedInAdmin.getByRole("tab", { name: /Conti/i }).click();
    await expect(signedInAdmin.getByText(/Saldato/i).first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(signedInAdmin.getByText(/Non saldato/i).first()).toBeVisible({
      timeout: 10_000,
    });

    // The "solo non saldati" filter on /conti keeps this azienda (it has unpaid).
    await signedInAdmin.goto("/conti");
    await expect(
      signedInAdmin.getByRole("heading", { level: 1, name: /Conti/i })
    ).toBeVisible({ timeout: 10_000 });
    const onlyUnpaid = signedInAdmin.getByRole("checkbox", {
      name: /Mostra solo/i,
    });
    await expect(onlyUnpaid).toBeChecked();
    await expect(
      signedInAdmin
        .getByRole("link")
        .filter({ hasText: AZIENDA_NOME })
        .first()
    ).toBeVisible({ timeout: 10_000 });
  });
});
