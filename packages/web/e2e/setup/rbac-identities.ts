import { initializeApp, getApps, type App } from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import {
  VETERINARIO_CAPS,
  TITOLARE_CAPS,
  AMMINISTRATORE_CAPS,
  encodeCaps,
  type Capability,
} from "@vet/shared";
import {
  AUTH_EMULATOR_HOST,
  EMULATOR_PROJECT_ID,
  FIRESTORE_EMULATOR_HOST,
  FIXTURE,
  type SeedAccount,
} from "./seed";

/**
 * Extra identities for the RBAC scenario. The base fixture in seed.ts only
 * carries a single approved vet, a god-mode admin, and a pending user. The
 * role-separation tests need one account per product role bundle plus a second
 * vet for cross-user checks, all seeded the same way auth.ts injects claims:
 * admin-SDK custom claims (`vet`, `roleId`, encoded `caps`, `capsVer`, `name`)
 * mirrored by an approved `users/{uid}` doc and an allowlist entry.
 */

export const RBAC_IDENTITIES = {
  semplice: {
    uid: "e2e-rbac-semplice-uid",
    email: "semplice.e2e@example.com",
    password: "Password-Semplice-1!",
    displayName: "RBAC Semplice",
    roleId: "veterinario_semplice",
    capabilities: [...VETERINARIO_CAPS] as Capability[],
    approved: true,
  },
  titolare: {
    uid: "e2e-rbac-titolare-uid",
    email: "titolare.e2e@example.com",
    password: "Password-Titolare-1!",
    displayName: "RBAC Titolare",
    roleId: "titolare",
    capabilities: [...TITOLARE_CAPS] as Capability[],
    approved: true,
  },
  amministratore: {
    uid: "e2e-rbac-admin-uid",
    email: "amm.e2e@example.com",
    password: "Password-Amm-1!",
    displayName: "RBAC Amministratore",
    roleId: "amministratore",
    capabilities: [...AMMINISTRATORE_CAPS] as Capability[],
    approved: true,
  },
  vetB: {
    uid: "e2e-rbac-vetb-uid",
    email: "vetb.e2e@example.com",
    password: "Password-VetB-1!",
    displayName: "RBAC Vet B",
    roleId: "veterinario_semplice",
    capabilities: [...VETERINARIO_CAPS] as Capability[],
    approved: true,
  },
} as const satisfies Record<string, SeedAccount>;

/**
 * A second activity owned by vet B, used to assert that vet A cannot delete
 * records that are not theirs. The base fixture activity (`FIXTURE.attivita`)
 * is owned by `FIXTURE.vet` and stands in as vet A's record.
 */
export const VETB_ATTIVITA_ID = "e2e-rbac-attivita-vetb";

function adminApp(): App {
  process.env["FIREBASE_AUTH_EMULATOR_HOST"] = AUTH_EMULATOR_HOST;
  process.env["FIRESTORE_EMULATOR_HOST"] = FIRESTORE_EMULATOR_HOST;
  const existing = getApps().find((a) => a.name === "[DEFAULT]");
  if (existing) return existing;
  return initializeApp({ projectId: EMULATOR_PROJECT_ID });
}

async function seedRoleDoc(
  db: FirebaseFirestore.Firestore,
  acc: SeedAccount
): Promise<void> {
  await db.collection("roles").doc(acc.roleId).set({
    name: acc.displayName,
    capabilities: acc.capabilities,
    locked: false,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    createdBy: "seed",
    updatedBy: "seed",
    schemaVersion: 1,
  });
}

async function seedIdentity(
  app: App,
  db: FirebaseFirestore.Firestore,
  acc: SeedAccount
): Promise<void> {
  const auth = getAdminAuth(app);
  try {
    await auth.deleteUser(acc.uid);
  } catch {
    void 0;
  }
  await auth.createUser({
    uid: acc.uid,
    email: acc.email,
    password: acc.password,
    displayName: acc.displayName,
    emailVerified: true,
  });
  await auth.setCustomUserClaims(acc.uid, {
    vet: true,
    roleId: acc.roleId,
    caps: encodeCaps(acc.capabilities),
    capsVer: 1,
    name: acc.displayName,
  });
  await db.collection("users").doc(acc.uid).set({
    email: acc.email,
    displayName: acc.displayName,
    disabled: false,
    approved: true,
    roleId: acc.roleId,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    lastSignInAt: FieldValue.serverTimestamp(),
    schemaVersion: 1,
  });
  const norm = acc.email.trim().toLowerCase();
  await db.collection("allowlist").doc(norm).set({
    email: acc.email,
    defaultRoleId: acc.roleId,
    invitedBy: "seed",
    invitedAt: FieldValue.serverTimestamp(),
    schemaVersion: 1,
  });
}

export async function seedVetBAttivita(): Promise<void> {
  const db = getFirestore(adminApp());
  const vetB = RBAC_IDENTITIES.vetB;
  await db.collection("attivita").doc(VETB_ATTIVITA_ID).set({
    data: new Date("2026-05-18T08:00:00.000Z"),
    aziendaId: FIXTURE.azienda.id,
    aziendaNome: FIXTURE.azienda.nome,
    tipoId: FIXTURE.tipo.id,
    tipoNome: FIXTURE.tipo.nome,
    oraria: false,
    adElemento: false,
    tariffa: 120,
    totale: 120,
    ownerUid: vetB.uid,
    ownerEmail: vetB.email,
    ownerName: vetB.displayName,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    isDeleted: false,
    schemaVersion: 1,
  });
}

export async function seedRbacIdentities(): Promise<void> {
  const app = adminApp();
  const db = getFirestore(app);
  await Promise.all(
    Object.values(RBAC_IDENTITIES).map(async (acc) => {
      await seedRoleDoc(db, acc);
      await seedIdentity(app, db, acc);
    })
  );
  await seedVetBAttivita();
}
