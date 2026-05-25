import type { User } from "../entities/User.js";
import type {
  UserApprovePatchArgs,
  UserRevokeSessionPatchArgs,
  UserSignInPatchArgs,
} from "../../firestore-dto/user.js";

export interface UserRepository {
  getById(uid: string): Promise<User | null>;
  listByRole(roleId: string): Promise<User[]>;
  listPending(): Promise<User[]>;
  /** Client-side callable; cloud function handler performs the actual mutation. */
  approve(uid: string, roleId: string): Promise<void>;
  /** Client-side callable; cloud function handler performs the actual deletion. */
  delete(uid: string): Promise<void>;
  /** Server-side patch applied by the approveUser handler. */
  applyApprovePatch(uid: string, args: UserApprovePatchArgs): Promise<void>;
  /** Server-side patch applied by beforeSignIn (first sign-in or update). */
  applySignInPatch(uid: string, args: UserSignInPatchArgs): Promise<void>;
  /** Server-side patch applied by selfRevoke / revokeUserSession / onAllowlistDelete. */
  applyRevokeSessionPatch(
    uid: string,
    args: UserRevokeSessionPatchArgs
  ): Promise<void>;
  /** Server-side hard delete (rejectUser handler). */
  hardDelete(uid: string): Promise<void>;
}
