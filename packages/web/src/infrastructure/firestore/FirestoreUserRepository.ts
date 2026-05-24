import {
  doc,
  getDoc,
  query,
  where,
  collection,
  getDocs,
  type Firestore,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import type { User, UserRepository } from "@vet/shared";

export class FirestoreUserRepository implements UserRepository {
  constructor(private readonly db: Firestore) {}

  async getById(uid: string): Promise<User | null> {
    const snap = await getDoc(doc(this.db, "users", uid));
    if (!snap.exists()) return null;
    return this.fromSnap(uid, snap.data());
  }

  async listByRole(roleId: string): Promise<User[]> {
    const q = query(collection(this.db, "users"), where("roleId", "==", roleId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => this.fromSnap(d.id, d.data()));
  }

  async listPending(): Promise<User[]> {
    const q = query(collection(this.db, "users"), where("approved", "==", false));
    const snap = await getDocs(q);
    return snap.docs.map((d) => this.fromSnap(d.id, d.data()));
  }

  async approve(uid: string, roleId: string): Promise<void> {
    const fn = httpsCallable(getFunctions(undefined, "europe-west8"), "approveUser");
    await fn({ uid, roleId });
  }

  async delete(uid: string): Promise<void> {
    const fn = httpsCallable(getFunctions(undefined, "europe-west8"), "rejectUser");
    await fn({ uid });
  }

  private fromSnap(uid: string, data: Record<string, unknown>): User {
    return {
      uid,
      email: data.email as string,
      displayName: data.displayName as string,
      roleId: data.roleId as string,
      approved: (data.approved as boolean) ?? false,
      disabled: (data.disabled as boolean) ?? false,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
      ...(data.lastSignInAt ? { lastSignInAt: toDate(data.lastSignInAt) } : {}),
      ...(data.approvedAt ? { approvedAt: toDate(data.approvedAt) } : {}),
      ...(data.approvedBy ? { approvedBy: data.approvedBy as string } : {}),
      schemaVersion: 1,
    };
  }
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
