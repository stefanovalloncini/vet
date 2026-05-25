import {
  doc,
  getDoc,
  collection,
  getDocs,
  setDoc,
  serverTimestamp,
  Timestamp,
  type FieldValue,
  type Firestore,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
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
  serverTimestamp: (): FieldValue => serverTimestamp(),
};

export class FirestoreAllowlistRepository implements AllowlistRepository {
  constructor(private readonly db: Firestore) {}

  async getByEmail(email: string): Promise<AllowlistEntry | null> {
    const norm = normalizeEmail(email);
    const snap = await getDoc(doc(this.db, "allowlist", norm));
    if (!snap.exists()) return null;
    return parseAllowlistEntry(norm, snap.data());
  }

  async list(): Promise<AllowlistEntry[]> {
    const snap = await getDocs(collection(this.db, "allowlist"));
    return snap.docs.map((d) => parseAllowlistEntry(d.id, d.data()));
  }

  async add(input: AllowlistEntryInput, actor: string): Promise<void> {
    const norm = normalizeEmail(input.email);
    await setDoc(
      doc(this.db, "allowlist", norm),
      buildAllowlistEntryAddDoc({ input, actor }, stampDeps)
    );
  }

  async remove(email: string): Promise<void> {
    const fn = httpsCallable<{ email: string }, { ok: true }>(
      getFunctions(undefined, "europe-west8"),
      "deleteAllowlistEntry"
    );
    await fn({ email });
  }
}
