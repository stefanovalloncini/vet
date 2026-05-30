import type { Page } from "@playwright/test";
import { initializeApp, getApps, type App } from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { TITOLARE_CAPS, encodeCaps, type Capability } from "@vet/shared";
import {
  AUTH_EMULATOR_HOST,
  EMULATOR_PROJECT_ID,
  FIRESTORE_EMULATOR_HOST,
  type SeedAccount,
} from "../setup/seed";
import { primeAuthStorage } from "../setup/auth";

/**
 * The seeded fixture only ships an admin and a plain vet. The billing
 * lifecycle scenario needs a *titolare* (capo): a non-admin who nonetheless
 * holds conti.emit + conti.saldo. We mint that identity here, mirroring the
 * shape of setup/seed.ts so the auth-storage priming in setup/auth.ts works
 * unchanged.
 */
export const TITOLARE: SeedAccount = {
  uid: "e2e-titolare-uid",
  email: "titolare.billing.e2e@example.com",
  password: "Password-Titolare-1!",
  displayName: "E2E Titolare",
  roleId: "titolare",
  capabilities: [...TITOLARE_CAPS] as Capability[],
  approved: true,
};

export const SCENARIO = {
  azienda: {
    id: "e2e-scn-azienda",
    nome: "Stalla Verdi Scenario",
    nomeNorm: "stalla verdi scenario",
    telefono: "045 1234567",
    canoneAnnuo: 800,
  },
  tipi: {
    visita: { id: "e2e-scn-tipo-visita", nome: "Visita clinica", ordine: 20 },
    emergenza: { id: "e2e-scn-tipo-emergenza", nome: "Emergenza", ordine: 30 },
    campioni: { id: "e2e-scn-tipo-campioni", nome: "Prelievo campioni", ordine: 40 },
    ginecologia: { id: "ginecologia", nome: "Ginecologia", ordine: 1 },
  },
} as const;

function adminApp(): App {
  process.env["FIREBASE_AUTH_EMULATOR_HOST"] = AUTH_EMULATOR_HOST;
  process.env["FIRESTORE_EMULATOR_HOST"] = FIRESTORE_EMULATOR_HOST;
  const existing = getApps().find((a) => a.name === "[DEFAULT]");
  if (existing) return existing;
  return initializeApp({ projectId: EMULATOR_PROJECT_ID });
}

async function seedTitolareUser(app: App): Promise<void> {
  const auth = getAdminAuth(app);
  const db = getFirestore(app);
  try {
    await auth.deleteUser(TITOLARE.uid);
  } catch {
    void 0;
  }
  try {
    const existing = await auth.getUserByEmail(TITOLARE.email);
    await auth.deleteUser(existing.uid);
  } catch {
    void 0;
  }
  await auth.createUser({
    uid: TITOLARE.uid,
    email: TITOLARE.email,
    password: TITOLARE.password,
    displayName: TITOLARE.displayName,
    emailVerified: true,
  });
  await auth.setCustomUserClaims(TITOLARE.uid, {
    vet: true,
    roleId: TITOLARE.roleId,
    caps: encodeCaps(TITOLARE.capabilities),
    capsVer: 1,
    name: TITOLARE.displayName,
  });
  await db.collection("users").doc(TITOLARE.uid).set({
    email: TITOLARE.email,
    displayName: TITOLARE.displayName,
    disabled: false,
    approved: true,
    roleId: TITOLARE.roleId,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    lastSignInAt: FieldValue.serverTimestamp(),
    schemaVersion: 1,
  });
  await db
    .collection("roles")
    .doc(TITOLARE.roleId)
    .set({
      name: "Titolare",
      capabilities: TITOLARE.capabilities,
      locked: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: "seed",
      updatedBy: "seed",
      schemaVersion: 1,
    });
}

async function seedScenarioTipi(app: App): Promise<void> {
  const db = getFirestore(app);
  const tipi = Object.values(SCENARIO.tipi);
  await Promise.all(
    tipi.map((tp) =>
      db.collection("activity_types").doc(tp.id).set({
        nome: tp.nome,
        ordine: tp.ordine,
        attivo: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        schemaVersion: 1,
      })
    )
  );
}

async function seedScenarioAzienda(app: App): Promise<void> {
  const db = getFirestore(app);
  await db
    .collection("aziende")
    .doc(SCENARIO.azienda.id)
    .set({
      nome: SCENARIO.azienda.nome,
      nomeNorm: SCENARIO.azienda.nomeNorm,
      telefono: SCENARIO.azienda.telefono,
      cadenzaFatturazione: "quarterly",
      armadiettoCanoneAnnuo: SCENARIO.azienda.canoneAnnuo,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: TITOLARE.uid,
      updatedBy: TITOLARE.uid,
      createdByName: TITOLARE.displayName,
      updatedByName: TITOLARE.displayName,
      isDeleted: false,
      schemaVersion: 1,
    });
}

async function deleteWhere(
  db: FirebaseFirestore.Firestore,
  collection: string,
  field: string,
  value: string
): Promise<void> {
  const snap = await db.collection(collection).where(field, "==", value).get();
  if (snap.empty) return;
  const batch = db.batch();
  for (const d of snap.docs) batch.delete(d.ref);
  await batch.commit();
}

/**
 * Wipe + reseed only the slices this scenario owns. Runs before each test so
 * the spec is self-contained regardless of what sibling specs leave behind.
 * The titolare identity (auth + claims) is stable, so it is minted once.
 */
export async function seedBillingScenario(opts?: {
  withAzienda?: boolean;
}): Promise<void> {
  const app = adminApp();
  const db = getFirestore(app);
  await Promise.all([
    deleteWhere(db, "conti", "aziendaId", SCENARIO.azienda.id),
    deleteWhere(db, "attivita", "aziendaId", SCENARIO.azienda.id),
  ]);
  await db.collection("aziende").doc(SCENARIO.azienda.id).delete();
  await seedScenarioTipi(app);
  if (opts?.withAzienda) await seedScenarioAzienda(app);
}

export async function ensureTitolare(): Promise<void> {
  await seedTitolareUser(adminApp());
}

export async function signInAsTitolare(page: Page, baseURL: string): Promise<void> {
  await primeAuthStorage(page, TITOLARE, baseURL);
}

interface ContoRecord {
  id: string;
  aziendaId: string;
  totaleConto: number;
  armadiettoImporto?: number;
  modalita: string;
  saldato: boolean;
  attivitaIds: string[];
}

export async function readContiForAzienda(aziendaId: string): Promise<ContoRecord[]> {
  const db = getFirestore(adminApp());
  const snap = await db
    .collection("conti")
    .where("aziendaId", "==", aziendaId)
    .get();
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      aziendaId: String(data["aziendaId"]),
      totaleConto: Number(data["totaleConto"]),
      ...(data["armadiettoImporto"] !== undefined
        ? { armadiettoImporto: Number(data["armadiettoImporto"]) }
        : {}),
      modalita: String(data["modalita"]),
      saldato: Boolean(data["saldato"]),
      attivitaIds: (data["attivitaIds"] as string[]) ?? [],
    };
  });
}

export async function readAttivitaTotaliForAzienda(
  aziendaId: string
): Promise<number[]> {
  const db = getFirestore(adminApp());
  const snap = await db
    .collection("attivita")
    .where("aziendaId", "==", aziendaId)
    .get();
  return snap.docs.map((d) => Number(d.data()["totale"]));
}
