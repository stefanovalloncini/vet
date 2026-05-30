import { getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
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
  if (existing) return existing;
  return initializeApp({ projectId: EMULATOR_PROJECT_ID });
}

function db(): FirebaseFirestore.Firestore {
  return getFirestore(adminApp());
}

export interface StoredAttivita {
  id: string;
  tipoId: string;
  aziendaId: string;
  oraria: boolean;
  adElemento: boolean;
  tariffa: number;
  ore?: number;
  elementi?: number;
  totale: number;
  note?: string;
}

export async function listAttivita(): Promise<StoredAttivita[]> {
  const snap = await db().collection("attivita").get();
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      tipoId: data["tipoId"] as string,
      aziendaId: data["aziendaId"] as string,
      oraria: data["oraria"] as boolean,
      adElemento: (data["adElemento"] as boolean) ?? false,
      tariffa: data["tariffa"] as number,
      ...(data["ore"] !== undefined ? { ore: data["ore"] as number } : {}),
      ...(data["elementi"] !== undefined
        ? { elementi: data["elementi"] as number }
        : {}),
      totale: data["totale"] as number,
      ...(data["note"] !== undefined ? { note: data["note"] as string } : {}),
    };
  });
}

export async function findAttivitaByTipo(
  tipoId: string
): Promise<StoredAttivita[]> {
  const all = await listAttivita();
  return all.filter((a) => a.tipoId === tipoId);
}

export async function countAttivita(): Promise<number> {
  return (await listAttivita()).length;
}

export interface SeedAziendaArgs {
  id: string;
  nome: string;
}

export async function seedAzienda(args: SeedAziendaArgs): Promise<void> {
  await db()
    .collection("aziende")
    .doc(args.id)
    .set({
      nome: args.nome,
      nomeNorm: args.nome.toLowerCase(),
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

export interface SeedTipoArgs {
  id: string;
  nome: string;
  ordine: number;
  tariffaStandard?: number;
  modalitaDefault?: "fissa" | "oraria" | "adElemento";
}

export async function seedTipo(args: SeedTipoArgs): Promise<void> {
  await db()
    .collection("activity_types")
    .doc(args.id)
    .set({
      nome: args.nome,
      ordine: args.ordine,
      attivo: true,
      ...(args.tariffaStandard !== undefined
        ? { tariffaStandard: args.tariffaStandard }
        : {}),
      ...(args.modalitaDefault !== undefined
        ? { modalitaDefault: args.modalitaDefault }
        : {}),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      schemaVersion: 1,
    });
}

export interface SeedRawAttivitaArgs {
  id: string;
  data: Date;
  aziendaId: string;
  aziendaNome: string;
  tipoId: string;
  tipoNome: string;
  tariffa: number;
  totale: number;
  note?: string;
}

export async function seedRawAttivita(args: SeedRawAttivitaArgs): Promise<void> {
  await db()
    .collection("attivita")
    .doc(args.id)
    .set({
      data: args.data,
      aziendaId: args.aziendaId,
      aziendaNome: args.aziendaNome,
      tipoId: args.tipoId,
      tipoNome: args.tipoNome,
      oraria: false,
      adElemento: false,
      tariffa: args.tariffa,
      totale: args.totale,
      ...(args.note !== undefined ? { note: args.note } : {}),
      ownerUid: FIXTURE.vet.uid,
      ownerEmail: FIXTURE.vet.email,
      ownerName: FIXTURE.vet.displayName,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      isDeleted: false,
      schemaVersion: 1,
    });
}

export async function countAziende(): Promise<number> {
  const snap = await db().collection("aziende").get();
  return snap.size;
}
