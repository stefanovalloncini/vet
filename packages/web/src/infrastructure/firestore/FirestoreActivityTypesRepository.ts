import {
  doc,
  getDoc,
  collection,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  where,
  deleteField,
  Timestamp,
  type FieldValue,
  type Firestore,
} from "firebase/firestore";
import type {
  ActivityType,
  ActivityTypeInput,
  ActivityTypesRepository,
  SerializerStampDeps,
} from "@vet/shared";
import {
  buildActivityTypeCreateDoc,
  buildActivityTypeUpdateDoc,
  parseActivityType,
} from "@vet/shared";

const stampDeps: SerializerStampDeps<Timestamp, FieldValue> = {
  fromDate: (d) => Timestamp.fromDate(d),
  serverTimestamp: (): FieldValue => serverTimestamp(),
};

export class FirestoreActivityTypesRepository
  implements ActivityTypesRepository
{
  constructor(private readonly db: Firestore) {}

  async list(): Promise<ActivityType[]> {
    const q = query(collection(this.db, "activity_types"), orderBy("ordine", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => parseActivityType(d.id, d.data()));
  }

  async listActive(): Promise<ActivityType[]> {
    const q = query(
      collection(this.db, "activity_types"),
      where("attivo", "==", true),
      orderBy("ordine", "asc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => parseActivityType(d.id, d.data()));
  }

  async getById(id: string): Promise<ActivityType | null> {
    const snap = await getDoc(doc(this.db, "activity_types", id));
    if (!snap.exists()) return null;
    return parseActivityType(id, snap.data());
  }

  async upsert(id: string, input: ActivityTypeInput): Promise<void> {
    const ref = doc(this.db, "activity_types", id);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, buildActivityTypeUpdateDoc({ input }, stampDeps));
      return;
    }
    await setDoc(ref, buildActivityTypeCreateDoc({ input }, stampDeps));
  }

  async setActive(id: string, attivo: boolean): Promise<void> {
    await setDoc(
      doc(this.db, "activity_types", id),
      { attivo, updatedAt: serverTimestamp() },
      { merge: true }
    );
  }

  async setStandardTariff(id: string, tariffa: number | null): Promise<void> {
    await setDoc(
      doc(this.db, "activity_types", id),
      {
        tariffaStandard: tariffa === null ? deleteField() : tariffa,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
}
