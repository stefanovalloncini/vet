import {
  FieldValue,
  Timestamp,
  type Firestore,
  type Query,
  type Transaction,
} from "firebase-admin/firestore";
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
  buildAttivitaCreateDoc,
  buildAttivitaSoftDeletePatch,
  buildAttivitaUpdatePatch,
  buildOptimisticEntity,
  parseAttivita,
} from "@vet/shared";

const stampDeps = {
  fromDate: (d: Date): Timestamp => Timestamp.fromDate(d),
  serverTimestamp: (): FieldValue => FieldValue.serverTimestamp(),
};

const updateDeps: AttivitaUpdateDeps<Timestamp, FieldValue, FieldValue> = {
  ...stampDeps,
  deleteField: (): FieldValue => FieldValue.delete(),
};

export class FirestoreAttivitaRepository implements AttivitaRepository {
  constructor(
    private readonly db: Firestore,
    private readonly tx?: Transaction
  ) {}

  async list(filters: AttivitaFilters = {}): Promise<Attivita[]> {
    let q: Query = this.db
      .collection("attivita")
      .where("isDeleted", "==", false);
    if (filters.aziendaId) q = q.where("aziendaId", "==", filters.aziendaId);
    if (filters.tipoId) q = q.where("tipoId", "==", filters.tipoId);
    if (filters.ownerUid) q = q.where("ownerUid", "==", filters.ownerUid);
    if (filters.from)
      q = q.where("data", ">=", Timestamp.fromDate(filters.from));
    if (filters.to) q = q.where("data", "<=", Timestamp.fromDate(filters.to));
    q = q.orderBy("data", "desc");
    const snap = await q.get();
    return snap.docs.map((d) => parseAttivita(d.id, d.data()));
  }

  async listDeleted(filters: TrashFilters = {}): Promise<Attivita[]> {
    let q: Query = this.db
      .collection("attivita")
      .where("isDeleted", "==", true);
    if (filters.ownerUid) q = q.where("ownerUid", "==", filters.ownerUid);
    q = q.orderBy("deletedAt", "desc");
    const snap = await q.get();
    return snap.docs.map((d) => parseAttivita(d.id, d.data()));
  }

  async getById(id: string): Promise<Attivita | null> {
    const ref = this.db.collection("attivita").doc(id);
    const snap = this.tx ? await this.tx.get(ref) : await ref.get();
    if (!snap.exists) return null;
    return parseAttivita(id, snap.data());
  }

  async findLastByAziendaAndTipo(
    aziendaId: string,
    tipoId: string
  ): Promise<Attivita | null> {
    const snap = await this.db
      .collection("attivita")
      .where("isDeleted", "==", false)
      .where("aziendaId", "==", aziendaId)
      .where("tipoId", "==", tipoId)
      .orderBy("data", "desc")
      .limit(1)
      .get();
    const first = snap.docs[0];
    if (!first) return null;
    return parseAttivita(first.id, first.data());
  }

  async create(
    input: AttivitaInput,
    denorm: { aziendaNome: string; tipoNome: string },
    actor: ActorContext
  ): Promise<Attivita> {
    const ref = this.db.collection("attivita").doc();
    await ref.set(buildAttivitaCreateDoc({ input, denorm, actor }, stampDeps));
    return buildOptimisticEntity({
      id: ref.id,
      buildDoc: (deps) => buildAttivitaCreateDoc({ input, denorm, actor }, deps),
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
    const patch = buildAttivitaUpdatePatch(
      { input, denorm, actor },
      updateDeps
    );
    await this.db.collection("attivita").doc(id).update({ ...patch });
  }

  async softDelete(id: string, actor: ActorContext): Promise<void> {
    const patch = buildAttivitaSoftDeletePatch({ actor }, stampDeps);
    await this.db.collection("attivita").doc(id).update({ ...patch });
  }

  async restore(id: string): Promise<void> {
    const ref = this.db.collection("attivita").doc(id);
    const patch = {
      isDeleted: false,
      deletedAt: FieldValue.delete(),
      deletedBy: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (this.tx) {
      this.tx.update(ref, patch);
      return;
    }
    await ref.update(patch);
  }

  async hardDelete(id: string): Promise<void> {
    const ref = this.db.collection("attivita").doc(id);
    if (this.tx) {
      this.tx.delete(ref);
      return;
    }
    await ref.delete();
  }

  async purgeOlderThanDeletedAt(cutoff: Date): Promise<number> {
    let total = 0;
    const BATCH_SIZE = 200;
    for (;;) {
      const snap = await this.db
        .collection("attivita")
        .where("isDeleted", "==", true)
        .where("deletedAt", "<", Timestamp.fromDate(cutoff))
        .limit(BATCH_SIZE)
        .get();
      if (snap.empty) break;
      const batch = this.db.batch();
      for (const d of snap.docs) batch.delete(d.ref);
      await batch.commit();
      total += snap.size;
      if (snap.size < BATCH_SIZE) break;
    }
    return total;
  }

  async hasAnyActive(): Promise<boolean> {
    const snap = await this.db
      .collection("attivita")
      .where("isDeleted", "==", false)
      .limit(1)
      .get();
    return !snap.empty;
  }

  async deleteAllForOwner(ownerUid: string): Promise<number> {
    let total = 0;
    const BATCH_SIZE = 400;
    for (;;) {
      const snap = await this.db
        .collection("attivita")
        .where("ownerUid", "==", ownerUid)
        .limit(BATCH_SIZE)
        .get();
      if (snap.empty) break;
      const batch = this.db.batch();
      for (const d of snap.docs) batch.delete(d.ref);
      await batch.commit();
      total += snap.size;
      if (snap.size < BATCH_SIZE) break;
    }
    return total;
  }

  async anonymizeOwnerReferences(
    editorUid: string,
    args: { anonUid: string; anonName: string }
  ): Promise<number> {
    const BATCH_SIZE = 400;
    let count = 0;
    for (;;) {
      const snap = await this.db
        .collection("attivita")
        .where("updatedBy", "==", editorUid)
        .limit(BATCH_SIZE)
        .get();
      if (snap.empty) break;
      const batch = this.db.batch();
      for (const d of snap.docs) {
        batch.update(d.ref, {
          updatedBy: args.anonUid,
          updatedByName: args.anonName,
        });
      }
      await batch.commit();
      count += snap.size;
      if (snap.size < BATCH_SIZE) break;
    }
    return count;
  }
}
