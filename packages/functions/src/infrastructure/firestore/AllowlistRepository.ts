import {
  FieldValue,
  Timestamp,
  type Firestore,
  type Transaction,
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
  constructor(
    private readonly db: Firestore,
    private readonly tx?: Transaction
  ) {}

  async getByEmail(email: string): Promise<AllowlistEntry | null> {
    const norm = normalizeEmail(email);
    const ref = this.db.collection("allowlist").doc(norm);
    const snap = this.tx ? await this.tx.get(ref) : await ref.get();
    if (!snap.exists) return null;
    return parseAllowlistEntry(norm, snap.data());
  }

  async list(): Promise<AllowlistEntry[]> {
    if (this.tx) {
      throw new Error("AllowlistRepository.list is not supported in a transaction");
    }
    const snap = await this.db.collection("allowlist").get();
    return snap.docs.map((d) => parseAllowlistEntry(d.id, d.data()));
  }

  async add(input: AllowlistEntryInput, actor: string): Promise<void> {
    const norm = normalizeEmail(input.email);
    const ref = this.db.collection("allowlist").doc(norm);
    const payload = buildAllowlistEntryAddDoc({ input, actor }, stampDeps);
    if (this.tx) {
      this.tx.set(ref, payload);
    } else {
      await ref.set(payload);
    }
  }

  async remove(email: string): Promise<void> {
    const norm = normalizeEmail(email);
    const ref = this.db.collection("allowlist").doc(norm);
    if (this.tx) {
      this.tx.delete(ref);
    } else {
      await ref.delete();
    }
  }
}
