import {
  doc,
  getDoc,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";
import type {
  AllowlistEntry,
  AllowlistEntryInput,
  AllowlistRepository,
} from "@vet/shared";
import { normalizeEmail } from "@vet/shared";

export class FirestoreAllowlistRepository implements AllowlistRepository {
  constructor(private readonly db: Firestore) {}

  async getByEmail(email: string): Promise<AllowlistEntry | null> {
    const norm = normalizeEmail(email);
    const snap = await getDoc(doc(this.db, "allowlist", norm));
    if (!snap.exists()) return null;
    return this.fromSnap(norm, snap.data());
  }

  async list(): Promise<AllowlistEntry[]> {
    const snap = await getDocs(collection(this.db, "allowlist"));
    return snap.docs.map((d) => this.fromSnap(d.id, d.data()));
  }

  async add(input: AllowlistEntryInput, actor: string): Promise<void> {
    const norm = normalizeEmail(input.email);
    await setDoc(doc(this.db, "allowlist", norm), {
      email: input.email,
      defaultRoleId: input.defaultRoleId,
      invitedBy: actor,
      invitedAt: serverTimestamp(),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      schemaVersion: 1,
    });
  }

  async remove(email: string): Promise<void> {
    await deleteDoc(doc(this.db, "allowlist", normalizeEmail(email)));
  }

  private fromSnap(emailNorm: string, data: Record<string, unknown>): AllowlistEntry {
    return {
      emailNorm,
      email: data.email as string,
      defaultRoleId: data.defaultRoleId as string,
      invitedBy: data.invitedBy as string,
      invitedAt: toDate(data.invitedAt),
      ...(data.notes ? { notes: data.notes as string } : {}),
      schemaVersion: 1,
    };
  }
}

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date(0);
}
