import {
  doc,
  getDoc,
  collection,
  getDocs,
  setDoc,
  serverTimestamp,
  query,
  orderBy,
  where,
  type Firestore,
} from "firebase/firestore";
import type {
  ActivityType,
  ActivityTypeInput,
  ActivityTypesRepository,
} from "@vet/shared";

export class FirestoreActivityTypesRepository
  implements ActivityTypesRepository
{
  constructor(private readonly db: Firestore) {}

  async list(): Promise<ActivityType[]> {
    const q = query(collection(this.db, "activity_types"), orderBy("ordine", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => fromSnap(d.id, d.data()));
  }

  async listActive(): Promise<ActivityType[]> {
    const q = query(
      collection(this.db, "activity_types"),
      where("attivo", "==", true),
      orderBy("ordine", "asc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => fromSnap(d.id, d.data()));
  }

  async getById(id: string): Promise<ActivityType | null> {
    const snap = await getDoc(doc(this.db, "activity_types", id));
    if (!snap.exists()) return null;
    return fromSnap(id, snap.data());
  }

  async upsert(id: string, input: ActivityTypeInput): Promise<void> {
    await setDoc(
      doc(this.db, "activity_types", id),
      {
        nome: input.nome,
        ordine: input.ordine,
        attivo: input.attivo,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        schemaVersion: 1,
      },
      { merge: true }
    );
  }

  async setActive(id: string, attivo: boolean): Promise<void> {
    await setDoc(
      doc(this.db, "activity_types", id),
      { attivo, updatedAt: serverTimestamp() },
      { merge: true }
    );
  }
}

function fromSnap(id: string, data: Record<string, unknown>): ActivityType {
  return {
    id,
    nome: data.nome as string,
    ordine: (data.ordine as number) ?? 0,
    attivo: (data.attivo as boolean) ?? true,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
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
