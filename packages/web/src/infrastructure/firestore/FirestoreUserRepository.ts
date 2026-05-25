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
import { parseUser } from "@vet/shared";

export class FirestoreUserRepository implements UserRepository {
  constructor(private readonly db: Firestore) {}

  async getById(uid: string): Promise<User | null> {
    const snap = await getDoc(doc(this.db, "users", uid));
    if (!snap.exists()) return null;
    return parseUser(uid, snap.data());
  }

  async listByRole(roleId: string): Promise<User[]> {
    const q = query(collection(this.db, "users"), where("roleId", "==", roleId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => parseUser(d.id, d.data()));
  }

  async listPending(): Promise<User[]> {
    const q = query(collection(this.db, "users"), where("approved", "==", false));
    const snap = await getDocs(q);
    return snap.docs.map((d) => parseUser(d.id, d.data()));
  }

  async approve(uid: string, roleId: string): Promise<void> {
    const fn = httpsCallable(getFunctions(undefined, "europe-west8"), "approveUser");
    await fn({ uid, roleId });
  }

  async delete(uid: string): Promise<void> {
    const fn = httpsCallable(getFunctions(undefined, "europe-west8"), "rejectUser");
    await fn({ uid });
  }
}
