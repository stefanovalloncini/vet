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
  deleteField,
  orderBy,
  type FieldValue,
  type Firestore,
} from "firebase/firestore";
import type {
  ActorContext,
  Azienda,
  AziendaInput,
  AziendeRepository,
  AziendaUpdateDeps,
} from "@vet/shared";
import {
  buildAziendaCreateDoc,
  buildAziendaSoftDeletePatch,
  buildAziendaUpdatePatch,
  parseAzienda,
} from "@vet/shared";

const stampDeps: Pick<
  AziendaUpdateDeps<FieldValue, FieldValue>,
  "serverTimestamp"
> = {
  serverTimestamp: (): FieldValue => serverTimestamp(),
};

const updateDeps: AziendaUpdateDeps<FieldValue, FieldValue> = {
  serverTimestamp: (): FieldValue => serverTimestamp(),
  deleteField: (): FieldValue => deleteField(),
};

export class FirestoreAziendeRepository implements AziendeRepository {
  constructor(private readonly db: Firestore) {}

  async list(): Promise<Azienda[]> {
    const q = query(
      collection(this.db, "aziende"),
      where("isDeleted", "==", false),
      orderBy("nomeNorm", "asc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => parseAzienda(d.id, d.data()));
  }

  async getById(id: string): Promise<Azienda | null> {
    const snap = await getDoc(doc(this.db, "aziende", id));
    if (!snap.exists()) return null;
    return parseAzienda(id, snap.data());
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
    return parseAzienda(first.id, first.data());
  }

  async create(input: AziendaInput, actor: ActorContext): Promise<string> {
    const ref = doc(collection(this.db, "aziende"));
    await setDoc(ref, buildAziendaCreateDoc({ input, actor }, stampDeps));
    return ref.id;
  }

  async update(
    id: string,
    input: AziendaInput,
    actor: ActorContext
  ): Promise<void> {
    const patch = buildAziendaUpdatePatch({ input, actor }, updateDeps);
    await updateDoc(doc(this.db, "aziende", id), { ...patch });
  }

  async softDelete(id: string, actor: ActorContext): Promise<void> {
    const patch = buildAziendaSoftDeletePatch({ actor }, stampDeps);
    await updateDoc(doc(this.db, "aziende", id), { ...patch });
  }
}
