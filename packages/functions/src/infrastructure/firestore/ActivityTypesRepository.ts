import {
  FieldValue,
  Timestamp,
  type Firestore,
} from "firebase-admin/firestore";
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
  serverTimestamp: () => FieldValue.serverTimestamp(),
};

export class FirestoreActivityTypesRepository
  implements ActivityTypesRepository
{
  constructor(private readonly db: Firestore) {}

  async list(): Promise<ActivityType[]> {
    const snap = await this.db
      .collection("activity_types")
      .orderBy("ordine", "asc")
      .get();
    return snap.docs.map((d) => parseActivityType(d.id, d.data()));
  }

  async listActive(): Promise<ActivityType[]> {
    const snap = await this.db
      .collection("activity_types")
      .where("attivo", "==", true)
      .orderBy("ordine", "asc")
      .get();
    return snap.docs.map((d) => parseActivityType(d.id, d.data()));
  }

  async getById(id: string): Promise<ActivityType | null> {
    const snap = await this.db.collection("activity_types").doc(id).get();
    if (!snap.exists) return null;
    return parseActivityType(id, snap.data());
  }

  async upsert(id: string, input: ActivityTypeInput): Promise<void> {
    const ref = this.db.collection("activity_types").doc(id);
    const snap = await ref.get();
    if (snap.exists) {
      await ref.update(buildActivityTypeUpdateDoc({ input }, stampDeps));
      return;
    }
    await ref.set(buildActivityTypeCreateDoc({ input }, stampDeps));
  }

  async setActive(id: string, attivo: boolean): Promise<void> {
    await this.db
      .collection("activity_types")
      .doc(id)
      .set(
        { attivo, updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
  }

  async setStandardTariff(id: string, tariffa: number | null): Promise<void> {
    await this.db
      .collection("activity_types")
      .doc(id)
      .set(
        {
          tariffaStandard: tariffa === null ? FieldValue.delete() : tariffa,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
  }
}
