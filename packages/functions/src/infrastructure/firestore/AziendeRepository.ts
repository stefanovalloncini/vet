import {
  FieldValue,
  Timestamp,
  type Firestore,
} from "firebase-admin/firestore";
import type {
  ActorContext,
  Azienda,
  AziendaInput,
  AziendaUpdateDeps,
  AziendeRepository,
} from "@vet/shared";
import {
  buildAziendaCreateDoc,
  buildAziendaSoftDeletePatch,
  buildAziendaUpdatePatch,
  buildOptimisticEntity,
  parseAzienda,
} from "@vet/shared";

const stampDeps = {
  fromDate: (d: Date): Timestamp => Timestamp.fromDate(d),
  serverTimestamp: (): FieldValue => FieldValue.serverTimestamp(),
};

const updateDeps: AziendaUpdateDeps<FieldValue, FieldValue> = {
  ...stampDeps,
  deleteField: (): FieldValue => FieldValue.delete(),
};

export class FirestoreAziendeRepository implements AziendeRepository {
  constructor(private readonly db: Firestore) {}

  async list(): Promise<Azienda[]> {
    const snap = await this.db
      .collection("aziende")
      .where("isDeleted", "==", false)
      .orderBy("nomeNorm", "asc")
      .get();
    return snap.docs.map((d) => parseAzienda(d.id, d.data()));
  }

  async getById(id: string): Promise<Azienda | null> {
    const snap = await this.db.collection("aziende").doc(id).get();
    if (!snap.exists) return null;
    return parseAzienda(id, snap.data());
  }

  async findByNomeNorm(nomeNorm: string): Promise<Azienda | null> {
    const snap = await this.db
      .collection("aziende")
      .where("nomeNorm", "==", nomeNorm)
      .where("isDeleted", "==", false)
      .limit(1)
      .get();
    const first = snap.docs[0];
    if (!first) return null;
    return parseAzienda(first.id, first.data());
  }

  async create(input: AziendaInput, actor: ActorContext): Promise<Azienda> {
    const ref = this.db.collection("aziende").doc();
    await ref.set(buildAziendaCreateDoc({ input, actor }, stampDeps));
    return buildOptimisticEntity({
      id: ref.id,
      buildDoc: (deps) => buildAziendaCreateDoc({ input, actor }, deps),
      parse: parseAzienda,
      now: new Date(),
    });
  }

  async update(
    id: string,
    input: AziendaInput,
    actor: ActorContext
  ): Promise<void> {
    const patch = buildAziendaUpdatePatch({ input, actor }, updateDeps);
    await this.db.collection("aziende").doc(id).update({ ...patch });
  }

  async softDelete(id: string, actor: ActorContext): Promise<void> {
    const patch = buildAziendaSoftDeletePatch({ actor }, stampDeps);
    await this.db.collection("aziende").doc(id).update({ ...patch });
  }
}
