import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { z } from "zod";
import { adminAuth } from "../admin/firebaseAdmin.js";
import { getRepositories } from "../infrastructure/composition.js";
import { decodeCaps } from "@vet/shared";
import { ensureRecentAuth } from "./recentAuth.js";

const inputSchema = z.object({ uid: z.string().min(1).max(128) }).strict();

export const rejectUser = onCall(
  { region: "europe-west8", enforceAppCheck: true },
  async (request) => {
    const actorUid = request.auth?.uid;
    const rawCaps = (request.auth?.token?.caps as string[] | undefined) ?? [];
    if (!actorUid || !decodeCaps(rawCaps).includes("users.approve")) {
      throw new HttpsError("permission-denied", "");
    }
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

    const actorEmail = (request.auth?.token?.email as string | undefined) ?? "";

    await repos.users.hardDelete(targetUid);
    try {
      await adminAuth.deleteUser(targetUid);
    } catch (err) {
      logger.warn("auth.rejectUser.authDeleteFailed", { targetUid, err: String(err) });
    }
    await repos.audit.record({
      actorUid,
      actorEmail,
      action: "user.reject",
      targetType: "user",
      targetId: targetUid,
      details: { email: user.email },
    });

    logger.info("auth.rejectUser", { actorUid, targetUid });

    return { ok: true as const };
  }
);
