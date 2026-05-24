import {
  doc,
  getDoc,
  collection,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp,
  deleteField,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  type Firestore,
  type QueryConstraint,
} from "firebase/firestore";
import type {
  ActorContext,
  Attivita,
  AttivitaFilters,
  AttivitaInput,
  AttivitaRepository,
  TrashFilters,
} from "@vet/shared";
import { computeTotale } from "@vet/shared";

export class FirestoreAttivitaRepository implements AttivitaRepository {
  constructor(private readonly db: Firestore) {}

  async list(filters: AttivitaFilters = {}): Promise<Attivita[]> {
    const constraints: QueryConstraint[] = [where("isDeleted", "==", false)];
    if (filters.aziendaId) constraints.push(where("aziendaId", "==", filters.aziendaId));
    if (filters.tipoId) constraints.push(where("tipoId", "==", filters.tipoId));
    if (filters.ownerUid) constraints.push(where("ownerUid", "==", filters.ownerUid));
    if (filters.from) constraints.push(where("data", ">=", Timestamp.fromDate(filters.from)));
    if (filters.to) constraints.push(where("data", "<=", Timestamp.fromDate(filters.to)));
    constraints.push(orderBy("data", "desc"));
    const snap = await getDocs(query(collection(this.db, "attivita"), ...constraints));
    return snap.docs.map((d) => fromSnap(d.id, d.data()));
  }

  async listDeleted(filters: TrashFilters = {}): Promise<Attivita[]> {
    const constraints: QueryConstraint[] = [where("isDeleted", "==", true)];
    if (filters.ownerUid) constraints.push(where("ownerUid", "==", filters.ownerUid));
    constraints.push(orderBy("deletedAt", "desc"));
    const snap = await getDocs(query(collection(this.db, "attivita"), ...constraints));
    return snap.docs.map((d) => fromSnap(d.id, d.data()));
  }

  async getById(id: string): Promise<Attivita | null> {
    const snap = await getDoc(doc(this.db, "attivita", id));
    if (!snap.exists()) return null;
    return fromSnap(id, snap.data());
  }

  async findLastByAziendaAndTipo(
    aziendaId: string,
    tipoId: string
  ): Promise<Attivita | null> {
    const q = query(
      collection(this.db, "attivita"),
      where("isDeleted", "==", false),
      where("aziendaId", "==", aziendaId),
      where("tipoId", "==", tipoId),
      orderBy("data", "desc"),
      limit(1)
    );
    const snap = await getDocs(q);
    const first = snap.docs[0];
    if (!first) return null;
    return fromSnap(first.id, first.data());
  }

  async create(
    input: AttivitaInput,
    denorm: { aziendaNome: string; tipoNome: string },
    actor: ActorContext
  ): Promise<string> {
    const ref = doc(collection(this.db, "attivita"));
    await setDoc(ref, {
      data: Timestamp.fromDate(input.data),
      aziendaId: input.aziendaId,
      aziendaNome: denorm.aziendaNome,
      tipoId: input.tipoId,
      tipoNome: denorm.tipoNome,
      oraria: input.oraria,
      tariffa: input.tariffa,
      ...(input.ore !== undefined ? { ore: input.ore } : {}),
      totale: computeTotale(input),
      ...(input.note !== undefined ? { note: input.note } : {}),
      ownerUid: actor.uid,
      ownerEmail: actor.email,
      ownerName: actor.displayName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isDeleted: false,
      schemaVersion: 1,
    });
    return ref.id;
  }

  async update(
    id: string,
    input: AttivitaInput,
    denorm: { aziendaNome: string; tipoNome: string },
    actor: ActorContext
  ): Promise<void> {
    await updateDoc(doc(this.db, "attivita", id), {
      data: Timestamp.fromDate(input.data),
      aziendaId: input.aziendaId,
      aziendaNome: denorm.aziendaNome,
      tipoId: input.tipoId,
      tipoNome: denorm.tipoNome,
      oraria: input.oraria,
      tariffa: input.tariffa,
      ore: input.ore !== undefined ? input.ore : deleteField(),
      totale: computeTotale(input),
      note: input.note !== undefined ? input.note : deleteField(),
      updatedAt: serverTimestamp(),
      updatedBy: actor.uid,
      updatedByName: actor.displayName,
    });
  }

  async softDelete(id: string, actor: ActorContext): Promise<void> {
    await updateDoc(doc(this.db, "attivita", id), {
      isDeleted: true,
      deletedAt: serverTimestamp(),
      deletedBy: actor.uid,
      updatedAt: serverTimestamp(),
    });
  }
}

function fromSnap(id: string, data: Record<string, unknown>): Attivita {
  return {
    id,
    data: toDate(data.data),
    aziendaId: data.aziendaId as string,
    aziendaNome: data.aziendaNome as string,
    tipoId: data.tipoId as string,
    tipoNome: data.tipoNome as string,
    oraria: (data.oraria as boolean) ?? false,
    tariffa: (data.tariffa as number) ?? 0,
    ...(data.ore !== undefined && data.ore !== null
      ? { ore: data.ore as number }
      : {}),
    totale: (data.totale as number) ?? 0,
    ...(data.note ? { note: data.note as string } : {}),
    ownerUid: data.ownerUid as string,
    ownerEmail: data.ownerEmail as string,
    ownerName: data.ownerName as string,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    isDeleted: (data.isDeleted as boolean) ?? false,
    ...(data.deletedAt ? { deletedAt: toDate(data.deletedAt) } : {}),
    ...(data.deletedBy ? { deletedBy: data.deletedBy as string } : {}),
    ...(data.updatedBy ? { updatedBy: data.updatedBy as string } : {}),
    ...(data.updatedByName ? { updatedByName: data.updatedByName as string } : {}),
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
