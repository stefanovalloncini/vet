import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { z } from "zod";
import { adminAuth, adminDb } from "../admin/firebaseAdmin.js";
import { getAuditRepository } from "../infrastructure/composition.js";
import { decodeCaps } from "@vet/shared";

const inputSchema = z.object({ uid: z.string().min(1).max(128) }).strict();

export const rejectUser = onCall(
  { region: "europe-west8", enforceAppCheck: true },
  async (request) => {
    const actorUid = request.auth?.uid;
    const rawCaps = (request.auth?.token?.caps as string[] | undefined) ?? [];
    if (!actorUid || !decodeCaps(rawCaps).includes("users.approve")) {
      throw new HttpsError("permission-denied", "");
    }

    let targetUid: string;
    try {
      ({ uid: targetUid } = inputSchema.parse(request.data));
    } catch {
      throw new HttpsError("invalid-argument", "");
    }
    if (targetUid === actorUid) {
      throw new HttpsError("failed-precondition", "cannot-reject-self");
    }

    const userSnap = await adminDb.collection("users").doc(targetUid).get();
    if (!userSnap.exists) {
      throw new HttpsError("not-found", "user");
    }

    const actorEmail = (request.auth?.token?.email as string | undefined) ?? "";
    const targetEmail = (userSnap.data()?.["email"] as string | undefined) ?? "";

    await adminDb.collection("users").doc(targetUid).delete();
    try {
      await adminAuth.deleteUser(targetUid);
    } catch (err) {
      logger.warn("auth.rejectUser.authDeleteFailed", { targetUid, err: String(err) });
    }
    await getAuditRepository().record({
      actorUid,
      actorEmail,
      action: "user.reject",
      targetType: "user",
      targetId: targetUid,
      details: { email: targetEmail },
    });

    logger.info("auth.rejectUser", { actorUid, targetUid });

    return { ok: true as const };
  }
);
