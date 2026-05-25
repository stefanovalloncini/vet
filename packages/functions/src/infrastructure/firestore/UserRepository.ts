import type { Firestore } from "firebase-admin/firestore";
import type { User, UserRepository } from "@vet/shared";
import { parseUser } from "@vet/shared";

export class FirestoreUserRepository implements UserRepository {
  constructor(private readonly db: Firestore) {}

  async getById(uid: string): Promise<User | null> {
    const snap = await this.db.collection("users").doc(uid).get();
    if (!snap.exists) return null;
    return parseUser(uid, snap.data());
  }

  async listByRole(roleId: string): Promise<User[]> {
    const snap = await this.db
      .collection("users")
      .where("roleId", "==", roleId)
      .get();
    return snap.docs.map((d) => parseUser(d.id, d.data()));
  }

  async listPending(): Promise<User[]> {
    const snap = await this.db
      .collection("users")
      .where("approved", "==", false)
      .get();
    return snap.docs.map((d) => parseUser(d.id, d.data()));
  }

  async approve(): Promise<void> {
    throw new Error("UserRepository.approve is handler-specific server-side");
  }

  async delete(): Promise<void> {
    throw new Error("UserRepository.delete is handler-specific server-side");
  }
}
