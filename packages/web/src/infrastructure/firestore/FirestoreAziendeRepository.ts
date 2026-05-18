import {
  doc,
  getDoc,
  collection,
  query,
  where,
  limit,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp,
  orderBy,
  type Firestore,
} from "firebase/firestore";
import type {
  ActorContext,
  Azienda,
  AziendaInput,
  AziendeRepository,
  CadenzaFatturazione,
} from "@vet/shared";
import { normalizeAziendaNome } from "@vet/shared";

export class FirestoreAziendeRepository implements AziendeRepository {
  constructor(private readonly db: Firestore) {}

  async list(): Promise<Azienda[]> {
    const q = query(
      collection(this.db, "aziende"),
      where("isDeleted", "==", false),
      orderBy("nomeNorm", "asc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => fromSnap(d.id, d.data()));
  }

  async getById(id: string): Promise<Azienda | null> {
    const snap = await getDoc(doc(this.db, "aziende", id));
    if (!snap.exists()) return null;
    return fromSnap(id, snap.data());
  }

  async findByNomeNorm(nomeNorm: string): Promise<Azienda | null> {
    const q = query(
      collection(this.db, "aziende"),
      where("nomeNorm", "==", nomeNorm),
      where("isDeleted", "==", false),
      limit(1)
    );
    const snap = await getDocs(q);
    const first = snap.docs[0];
    if (!first) return null;
    return fromSnap(first.id, first.data());
  }

  async create(input: AziendaInput, actor: ActorContext): Promise<string> {
    const ref = doc(collection(this.db, "aziende"));
    await setDoc(ref, {
      nome: input.nome,
      nomeNorm: normalizeAziendaNome(input.nome),
      ...(input.indirizzo !== undefined ? { indirizzo: input.indirizzo } : {}),
      ...(input.piva !== undefined ? { piva: input.piva } : {}),
      ...(input.emailFatturazione !== undefined
        ? { emailFatturazione: input.emailFatturazione }
        : {}),
      ...(input.cadenzaFatturazione !== undefined
        ? { cadenzaFatturazione: input.cadenzaFatturazione }
        : {}),
      ...(input.note !== undefined ? { note: input.note } : {}),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: actor.uid,
      updatedBy: actor.uid,
      createdByName: actor.displayName,
      updatedByName: actor.displayName,
      isDeleted: false,
      schemaVersion: 1,
    });
    return ref.id;
  }

  async update(
    id: string,
    input: AziendaInput,
    actor: ActorContext
  ): Promise<void> {
    await updateDoc(doc(this.db, "aziende", id), {
      nome: input.nome,
      nomeNorm: normalizeAziendaNome(input.nome),
      indirizzo: input.indirizzo ?? null,
      piva: input.piva ?? null,
      emailFatturazione: input.emailFatturazione ?? null,
      cadenzaFatturazione: input.cadenzaFatturazione ?? null,
      note: input.note ?? null,
      updatedAt: serverTimestamp(),
      updatedBy: actor.uid,
      updatedByName: actor.displayName,
    });
  }

  async softDelete(id: string, actor: ActorContext): Promise<void> {
    await updateDoc(doc(this.db, "aziende", id), {
      isDeleted: true,
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: actor.uid,
      updatedByName: actor.displayName,
    });
  }
}

function fromSnap(id: string, data: Record<string, unknown>): Azienda {
  return {
    id,
    nome: data.nome as string,
    nomeNorm: data.nomeNorm as string,
    ...(data.indirizzo ? { indirizzo: data.indirizzo as string } : {}),
    ...(data.piva ? { piva: data.piva as string } : {}),
    ...(data.emailFatturazione
      ? { emailFatturazione: data.emailFatturazione as string }
      : {}),
    ...(data.cadenzaFatturazione
      ? { cadenzaFatturazione: data.cadenzaFatturazione as CadenzaFatturazione }
      : {}),
    ...(data.note ? { note: data.note as string } : {}),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    createdBy: data.createdBy as string,
    updatedBy: data.updatedBy as string,
    createdByName: data.createdByName as string,
    updatedByName: data.updatedByName as string,
    isDeleted: (data.isDeleted as boolean) ?? false,
    ...(data.deletedAt ? { deletedAt: toDate(data.deletedAt) } : {}),
    schemaVersion: 1,
  };
}

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date(0);
}
