import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { z } from "zod";
import { adminAuth } from "../admin/firebaseAdmin.js";
import { getRepositories } from "../infrastructure/composition.js";
import { readActorClaims } from "./actorClaims.js";
import { ensureRecentAuth } from "./recentAuth.js";

const inputSchema = z.object({ uid: z.string().min(1).max(128) }).strict();

export function ensureCanRejectUser(actor: {
  uid: string | undefined;
  caps: readonly string[];
}): string {
  if (!actor.uid || !actor.caps.includes("users.approve")) {
    throw new HttpsError("permission-denied", "");
  }
  return actor.uid;
}

export const rejectUser = onCall(
  { region: "europe-west8", enforceAppCheck: true },
  async (request) => {
    const { email: actorEmail, caps } = readActorClaims(request.auth?.token);
    const actorUid = ensureCanRejectUser({ uid: request.auth?.uid, caps });
    ensureRecentAuth(request);

    let targetUid: string;
    try {
      ({ uid: targetUid } = inputSchema.parse(request.data));
    } catch {
      throw new HttpsError("invalid-argument", "");
    }
    if (targetUid === actorUid) {
      throw new HttpsError("failed-precondition", "cannot-reject-self");
    }

    const repos = getRepositories();
    const user = await repos.users.getById(targetUid);
    if (!user) {
      throw new HttpsError("not-found", "user");
    }

    await repos.run(async (tx) => {
      await tx.users.hardDelete(targetUid);
      await tx.audit.record({
        actorUid,
        actorEmail,
        action: "user.reject",
        targetType: "user",
        targetId: targetUid,
        details: { email: user.email },
      });
    });

    try {
      await adminAuth.deleteUser(targetUid);
    } catch (err) {
      logger.warn("auth.rejectUser.authDeleteFailed", { targetUid, err: String(err) });
    }

    logger.info("auth.rejectUser", { actorUid, targetUid });

    return { ok: true as const };
  }
);
