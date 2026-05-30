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
  type FieldValue,
  type Firestore,
  type QueryConstraint,
} from "firebase/firestore";
import type {
  ActorContext,
  Attivita,
  AttivitaFilters,
  AttivitaInput,
  AttivitaRepository,
  AttivitaUpdateDeps,
  TrashFilters,
} from "@vet/shared";
import {
  attivitaInputSchema,
  buildAttivitaCreateDoc,
  buildAttivitaSoftDeletePatch,
  buildAttivitaUpdatePatch,
  buildOptimisticEntity,
  parseAttivita,
} from "@vet/shared";

const stampDeps = {
  fromDate: (d: Date): Timestamp => Timestamp.fromDate(d),
  serverTimestamp: (): FieldValue => serverTimestamp(),
};

const updateDeps: AttivitaUpdateDeps<Timestamp, FieldValue, FieldValue> = {
  ...stampDeps,
  deleteField: (): FieldValue => deleteField(),
};

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
    return snap.docs.map((d) => parseAttivita(d.id, d.data()));
  }

  async listDeleted(filters: TrashFilters = {}): Promise<Attivita[]> {
    const constraints: QueryConstraint[] = [where("isDeleted", "==", true)];
    if (filters.ownerUid) constraints.push(where("ownerUid", "==", filters.ownerUid));
    constraints.push(orderBy("deletedAt", "desc"));
    const snap = await getDocs(query(collection(this.db, "attivita"), ...constraints));
    return snap.docs.map((d) => parseAttivita(d.id, d.data()));
  }

  async getById(id: string): Promise<Attivita | null> {
    const snap = await getDoc(doc(this.db, "attivita", id));
    if (!snap.exists()) return null;
    return parseAttivita(id, snap.data());
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
    return parseAttivita(first.id, first.data());
  }

  async create(
    input: AttivitaInput,
    denorm: { aziendaNome: string; tipoNome: string },
    actor: ActorContext
  ): Promise<Attivita> {
    const valid = attivitaInputSchema.parse(input);
    const ref = doc(collection(this.db, "attivita"));
    await setDoc(ref, buildAttivitaCreateDoc({ input: valid, denorm, actor }, stampDeps));
    return buildOptimisticEntity({
      id: ref.id,
      buildDoc: (deps) => buildAttivitaCreateDoc({ input: valid, denorm, actor }, deps),
      parse: parseAttivita,
      now: new Date(),
    });
  }

  async update(
    id: string,
    input: AttivitaInput,
    denorm: { aziendaNome: string; tipoNome: string },
    actor: ActorContext
  ): Promise<void> {
    const valid = attivitaInputSchema.parse(input);
    const patch = buildAttivitaUpdatePatch(
      { input: valid, denorm, actor },
      updateDeps
    );
    await updateDoc(doc(this.db, "attivita", id), { ...patch });
  }

  async softDelete(id: string, actor: ActorContext): Promise<void> {
    const patch = buildAttivitaSoftDeletePatch({ actor }, stampDeps);
    await updateDoc(doc(this.db, "attivita", id), { ...patch });
  }

  async restore(): Promise<void> {
    throw new Error("AttivitaRepository.restore is server-only");
  }

  async hardDelete(): Promise<void> {
    throw new Error("AttivitaRepository.hardDelete is server-only");
  }

  async purgeOlderThanDeletedAt(): Promise<number> {
    throw new Error("AttivitaRepository.purgeOlderThanDeletedAt is server-only");
  }

  async deleteAllForOwner(): Promise<number> {
    throw new Error("AttivitaRepository.deleteAllForOwner is server-only");
  }

  async anonymizeOwnerReferences(): Promise<number> {
    throw new Error(
      "AttivitaRepository.anonymizeOwnerReferences is server-only"
    );
  }
}
