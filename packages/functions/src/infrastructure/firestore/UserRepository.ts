import {
  FieldValue,
  Timestamp,
  type Firestore,
} from "firebase-admin/firestore";
import type {
  User,
  UserRepository,
  UserApprovePatchArgs,
  UserRevokeSessionPatchArgs,
  UserSignInPatchArgs,
  SerializerStampDeps,
} from "@vet/shared";
import {
  buildUserApprovePatch,
  buildUserRevokeSessionPatch,
  buildUserSignInPatch,
  parseUser,
} from "@vet/shared";

const stampDeps: SerializerStampDeps<Timestamp, FieldValue> = {
  fromDate: (d) => Timestamp.fromDate(d),
  serverTimestamp: () => FieldValue.serverTimestamp(),
};

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
    throw new Error(
      "UserRepository.approve is a client-side callable; server handlers should call applyApprovePatch"
    );
  }

  async delete(): Promise<void> {
    throw new Error(
      "UserRepository.delete is a client-side callable; server handlers should call hardDelete"
    );
  }

  async applyApprovePatch(
    uid: string,
    args: UserApprovePatchArgs
  ): Promise<void> {
    await this.db
      .collection("users")
      .doc(uid)
      .set(buildUserApprovePatch(args, stampDeps), { merge: true });
  }

  async applySignInPatch(
    uid: string,
    args: UserSignInPatchArgs
  ): Promise<void> {
    await this.db
      .collection("users")
      .doc(uid)
      .set(buildUserSignInPatch(args, stampDeps), { merge: true });
  }

  async applyRevokeSessionPatch(
    uid: string,
    args: UserRevokeSessionPatchArgs
  ): Promise<void> {
    await this.db
      .collection("users")
      .doc(uid)
      .set(buildUserRevokeSessionPatch(args, stampDeps), { merge: true });
  }

  async hardDelete(uid: string): Promise<void> {
    await this.db.collection("users").doc(uid).delete();
  }
}
