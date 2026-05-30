import { getApps, initializeApp, type App } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import {
  AUTH_EMULATOR_HOST,
  EMULATOR_PROJECT_ID,
  FIRESTORE_EMULATOR_HOST,
  FIXTURE,
} from "../setup/seed";

function adminApp(): App {
  process.env["FIREBASE_AUTH_EMULATOR_HOST"] = AUTH_EMULATOR_HOST;
  process.env["FIRESTORE_EMULATOR_HOST"] = FIRESTORE_EMULATOR_HOST;
  const existing = getApps().find((a) => a.name === "[DEFAULT]");
  return existing ?? initializeApp({ projectId: EMULATOR_PROJECT_ID });
}

function db(): FirebaseFirestore.Firestore {
  return getFirestore(adminApp());
}

export interface SeededAttivitaRef {
  id: string;
  data: Date;
}

export async function seedAttivitaAt(
  data: Date,
  overrides: { id?: string; tariffa?: number } = {}
): Promise<SeededAttivitaRef> {
  const id = overrides.id ?? `e2e-extra-${data.getTime()}`;
  const tariffa = overrides.tariffa ?? 120;
  await db()
    .collection("attivita")
    .doc(id)
    .set({
      data,
      aziendaId: FIXTURE.azienda.id,
      aziendaNome: FIXTURE.azienda.nome,
      tipoId: FIXTURE.tipo.id,
      tipoNome: FIXTURE.tipo.nome,
      oraria: false,
      adElemento: false,
      tariffa,
      totale: tariffa,
      ownerUid: FIXTURE.vet.uid,
      ownerEmail: FIXTURE.vet.email,
      ownerName: FIXTURE.vet.displayName,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      isDeleted: false,
      schemaVersion: 1,
    });
  return { id, data };
}

export async function softDeleteAttivita(id: string): Promise<void> {
  await db()
    .collection("attivita")
    .doc(id)
    .update({
      isDeleted: true,
      deletedAt: FieldValue.serverTimestamp(),
      deletedBy: FIXTURE.vet.uid,
      updatedAt: FieldValue.serverTimestamp(),
    });
}

export interface SeededReminderRef {
  id: string;
  titolo: string;
}

export async function seedReminderFor(
  titolo: string,
  dueAt: Date = new Date("2026-09-01T00:00:00.000Z"),
  overrides: { id?: string } = {}
): Promise<SeededReminderRef> {
  const id = overrides.id ?? `e2e-rem-${Date.now()}`;
  await db()
    .collection("reminders")
    .doc(id)
    .set({
      aziendaId: FIXTURE.azienda.id,
      aziendaNome: FIXTURE.azienda.nome,
      titolo,
      dueAt,
      done: false,
      doneAt: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: FIXTURE.vet.uid,
      schemaVersion: 1,
    });
  return { id, titolo };
}

export function noonToday(now: Date = new Date()): Date {
  const d = new Date(now);
  d.setHours(12, 0, 0, 0);
  return d;
}
