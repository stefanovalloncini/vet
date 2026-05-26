import {
  FieldValue,
  Timestamp,
  type Firestore,
  type Transaction,
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

function isFirestoreNotFound(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: number | string; message?: string };
  if (e.code === 5 || e.code === "not-found" || e.code === "NOT_FOUND") {
    return true;
  }
  if (typeof e.message === "string" && e.message.includes("No document to update")) {
    return true;
  }
  return false;
}

const stampDeps: SerializerStampDeps<Timestamp, FieldValue> = {
  fromDate: (d) => Timestamp.fromDate(d),
  serverTimestamp: () => FieldValue.serverTimestamp(),
};

export class FirestoreUserRepository implements UserRepository {
  constructor(
    private readonly db: Firestore,
    private readonly tx?: Transaction
  ) {}

  async getById(uid: string): Promise<User | null> {
    const ref = this.db.collection("users").doc(uid);
    const snap = this.tx ? await this.tx.get(ref) : await ref.get();
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
    const ref = this.db.collection("users").doc(uid);
    const patch = buildUserApprovePatch(args, stampDeps);
    if (this.tx) {
      this.tx.set(ref, patch, { merge: true });
      return;
    }
    await ref.set(patch, { merge: true });
  }

  async applySignInPatch(
    uid: string,
    args: UserSignInPatchArgs
  ): Promise<void> {
    const ref = this.db.collection("users").doc(uid);
    const patch = buildUserSignInPatch(args, stampDeps);
    if (this.tx) {
      this.tx.set(ref, patch, { merge: true });
      return;
    }
    await ref.set(patch, { merge: true });
  }

  async applyRevokeSessionPatch(
    uid: string,
    args: UserRevokeSessionPatchArgs
  ): Promise<void> {
    const ref = this.db.collection("users").doc(uid);
    const patch = { ...buildUserRevokeSessionPatch(args, stampDeps) };
    if (this.tx) {
      this.tx.update(ref, patch);
      return;
    }
    try {
      await ref.update(patch);
    } catch (err) {
      if (isFirestoreNotFound(err)) return;
      throw err;
    }
  }

  async hardDelete(uid: string): Promise<void> {
    const ref = this.db.collection("users").doc(uid);
    if (this.tx) {
      this.tx.delete(ref);
      return;
    }
    await ref.delete();
  }
}
