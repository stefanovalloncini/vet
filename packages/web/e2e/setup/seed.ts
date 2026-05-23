import { initializeApp, getApps, type App } from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { CAPABILITIES, encodeCaps, type Capability } from "@vet/shared";

export const EMULATOR_PROJECT_ID = "vet-e2e";
export const AUTH_EMULATOR_HOST = "127.0.0.1:9099";
export const FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

export interface SeedAccount {
  uid: string;
  email: string;
  password: string;
  displayName: string;
  roleId: string;
  capabilities: Capability[];
  approved: boolean;
}

export interface SeedFixture {
  admin: SeedAccount;
  vet: SeedAccount;
  pending: SeedAccount;
  azienda: { id: string; nome: string };
  tipo: { id: string; nome: string };
  attivita: { id: string };
}

const ADMIN_CAPS: Capability[] = [...CAPABILITIES];
const VET_CAPS: Capability[] = [
  "activities.read.all",
  "activities.create",
  "activities.update.own",
  "activities.delete.own",
  "activities.export",
  "aziende.read",
  "aziende.create",
  "aziende.update",
  "activity_types.read",
  "trash.read.own",
  "trash.restore.own",
  "payments.read",
  "payments.read.any",
  "payments.manage",
  "reminders.read",
  "reminders.create",
  "reminders.update.own",
  "reminders.delete.own",
];

export const FIXTURE: SeedFixture = {
  admin: {
    uid: "e2e-admin-uid",
    email: "admin.e2e@example.com",
    password: "Password-Admin-1!",
    displayName: "E2E Admin",
    roleId: "admin",
    capabilities: ADMIN_CAPS,
    approved: true,
  },
  vet: {
    uid: "e2e-vet-uid",
    email: "vet.e2e@example.com",
    password: "Password-Vet-1!",
    displayName: "E2E Vet",
    roleId: "vet",
    capabilities: VET_CAPS,
    approved: true,
  },
  pending: {
    uid: "e2e-pending-uid",
    email: "pending.e2e@example.com",
    password: "Password-Pending-1!",
    displayName: "E2E Pending",
    roleId: "vet",
    capabilities: [],
    approved: false,
  },
  azienda: { id: "e2e-azienda-1", nome: "Allevamento Bianchi" },
  tipo: { id: "e2e-tipo-1", nome: "Visita generica" },
  attivita: { id: "e2e-attivita-1" },
};

function adminApp(): App {
  process.env["FIREBASE_AUTH_EMULATOR_HOST"] = AUTH_EMULATOR_HOST;
  process.env["FIRESTORE_EMULATOR_HOST"] = FIRESTORE_EMULATOR_HOST;
  const existing = getApps().find((a) => a.name === "[DEFAULT]");
  if (existing) return existing;
  return initializeApp({ projectId: EMULATOR_PROJECT_ID });
}

async function resetEmulators(): Promise<void> {
  const fsRes = await fetch(
    `http://${FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${EMULATOR_PROJECT_ID}/databases/(default)/documents`,
    { method: "DELETE" }
  );
  if (!fsRes.ok && fsRes.status !== 200) {
    throw new Error(`firestore wipe failed: ${fsRes.status}`);
  }
  const authRes = await fetch(
    `http://${AUTH_EMULATOR_HOST}/emulator/v1/projects/${EMULATOR_PROJECT_ID}/accounts`,
    { method: "DELETE" }
  );
  if (!authRes.ok) {
    throw new Error(`auth wipe failed: ${authRes.status}`);
  }
}

async function seedRoles(db: FirebaseFirestore.Firestore): Promise<void> {
  const roles = [
    { id: "admin", name: "Amministratore", caps: ADMIN_CAPS, locked: true },
    { id: "vet", name: "Veterinario", caps: VET_CAPS, locked: false },
  ];
  for (const r of roles) {
    await db.collection("roles").doc(r.id).set({
      name: r.name,
      capabilities: r.caps,
      locked: r.locked,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: "seed",
      updatedBy: "seed",
      schemaVersion: 1,
    });
  }
}

async function seedAllowlist(db: FirebaseFirestore.Firestore): Promise<void> {
  for (const acc of [FIXTURE.admin, FIXTURE.vet, FIXTURE.pending]) {
    const norm = acc.email.trim().toLowerCase();
    await db.collection("allowlist").doc(norm).set({
      email: acc.email,
      defaultRoleId: acc.roleId,
      invitedBy: "seed",
      invitedAt: FieldValue.serverTimestamp(),
      schemaVersion: 1,
    });
  }
}

async function seedUsers(
  app: App,
  db: FirebaseFirestore.Firestore
): Promise<void> {
  const auth = getAdminAuth(app);
  for (const acc of [FIXTURE.admin, FIXTURE.vet, FIXTURE.pending]) {
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
    if (acc.approved) {
      await auth.setCustomUserClaims(acc.uid, {
        vet: true,
        roleId: acc.roleId,
        caps: encodeCaps(acc.capabilities),
        capsVer: 1,
        name: acc.displayName,
      });
    }
    await db.collection("users").doc(acc.uid).set({
      email: acc.email,
      displayName: acc.displayName,
      disabled: false,
      approved: acc.approved,
      roleId: acc.roleId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      lastSignInAt: FieldValue.serverTimestamp(),
      schemaVersion: 1,
    });
  }
}

async function seedActivityType(db: FirebaseFirestore.Firestore): Promise<void> {
  await db.collection("activity_types").doc(FIXTURE.tipo.id).set({
    nome: FIXTURE.tipo.nome,
    ordine: 10,
    attivo: true,
    tariffaStandard: 80,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    schemaVersion: 1,
  });
}

async function seedAzienda(db: FirebaseFirestore.Firestore): Promise<void> {
  await db.collection("aziende").doc(FIXTURE.azienda.id).set({
    nome: FIXTURE.azienda.nome,
    nomeNorm: FIXTURE.azienda.nome.toLowerCase(),
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

async function seedAttivita(db: FirebaseFirestore.Firestore): Promise<void> {
  await db.collection("attivita").doc(FIXTURE.attivita.id).set({
    data: new Date("2026-05-15T08:00:00.000Z"),
    aziendaId: FIXTURE.azienda.id,
    aziendaNome: FIXTURE.azienda.nome,
    tipoId: FIXTURE.tipo.id,
    tipoNome: FIXTURE.tipo.nome,
    oraria: false,
    tariffa: 80,
    totale: 80,
    ownerUid: FIXTURE.vet.uid,
    ownerEmail: FIXTURE.vet.email,
    ownerName: FIXTURE.vet.displayName,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    isDeleted: false,
    schemaVersion: 1,
  });
}

export async function seedAll(): Promise<SeedFixture> {
  const app = adminApp();
  await resetEmulators();
  const db = getFirestore(app);
  await seedRoles(db);
  await seedAllowlist(db);
  await seedUsers(app, db);
  await seedActivityType(db);
  await seedAzienda(db);
  await seedAttivita(db);
  return FIXTURE;
}
