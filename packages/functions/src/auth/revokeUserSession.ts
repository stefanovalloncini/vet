import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { z } from "zod";
import { adminAuth } from "../admin/firebaseAdmin.js";
import { getRepositories } from "../infrastructure/composition.js";
import { readActorClaims } from "./actorClaims.js";
import { ensureRecentAuth } from "./recentAuth.js";

const inputSchema = z.object({ uid: z.string().min(1).max(128) }).strict();

interface Caller {
  uid: string;
  caps: string[];
}

export function ensureCanRevoke(caller: Caller | null): void {
  if (!caller) throw new HttpsError("unauthenticated", "");
  if (!caller.caps.includes("allowlist.manage")) {
    throw new HttpsError("permission-denied", "");
  }
}

export function ensureNotSelf(targetUid: string, callerUid: string): void {
  if (targetUid === callerUid) {
    throw new HttpsError("failed-precondition", "cannot-revoke-self");
  }
}

export const revokeUserSession = onCall(
  { region: "europe-west8", enforceAppCheck: true },
  async (request) => {
    const auth = request.auth;
    const { email: actorEmail, caps } = readActorClaims(auth?.token);
    const caller: Caller | null = auth ? { uid: auth.uid, caps } : null;

    ensureCanRevoke(caller);
    ensureRecentAuth(request);

    let uid: string;
    try {
      ({ uid } = inputSchema.parse(request.data));
    } catch {
      throw new HttpsError("invalid-argument", "");
    }
    ensureNotSelf(uid, caller!.uid);

    const repos = getRepositories();

    try {
      await adminAuth.revokeRefreshTokens(uid);
      await adminAuth.updateUser(uid, { disabled: true });
    } catch (err) {
      logger.warn("auth.revokeUserSession.authUpdateFailed", { uid, err: String(err) });
    }

    await repos.run(async (tx) => {
      await tx.users.applyRevokeSessionPatch(uid, {
        disabled: true,
        minCapsVer: Date.now(),
      });
      await tx.audit.record({
        actorUid: caller!.uid,
        actorEmail,
        action: "user.session.revoke",
        targetType: "user",
        targetId: uid,
      });
    });

    return { ok: true };
  }
);
