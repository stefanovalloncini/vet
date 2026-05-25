import {
  FieldValue,
  Timestamp,
  type Firestore,
} from "firebase-admin/firestore";
import type {
  AllowlistEntry,
  AllowlistEntryInput,
  AllowlistRepository,
  SerializerStampDeps,
} from "@vet/shared";
import {
  buildAllowlistEntryAddDoc,
  normalizeEmail,
  parseAllowlistEntry,
} from "@vet/shared";

const stampDeps: SerializerStampDeps<Timestamp, FieldValue> = {
  fromDate: (d) => Timestamp.fromDate(d),
  serverTimestamp: () => FieldValue.serverTimestamp(),
};

export class FirestoreAllowlistRepository implements AllowlistRepository {
  constructor(private readonly db: Firestore) {}

  async getByEmail(email: string): Promise<AllowlistEntry | null> {
    const norm = normalizeEmail(email);
    const snap = await this.db.collection("allowlist").doc(norm).get();
    if (!snap.exists) return null;
    return parseAllowlistEntry(norm, snap.data());
  }

  async list(): Promise<AllowlistEntry[]> {
    const snap = await this.db.collection("allowlist").get();
    return snap.docs.map((d) => parseAllowlistEntry(d.id, d.data()));
  }

  async add(input: AllowlistEntryInput, actor: string): Promise<void> {
    const norm = normalizeEmail(input.email);
    await this.db
      .collection("allowlist")
      .doc(norm)
      .set(buildAllowlistEntryAddDoc({ input, actor }, stampDeps));
  }

  async remove(email: string): Promise<void> {
    const norm = normalizeEmail(email);
    await this.db.collection("allowlist").doc(norm).delete();
  }
}
