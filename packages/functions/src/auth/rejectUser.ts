import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { adminAuth, adminDb } from "../admin/firebaseAdmin.js";
import { decodeCaps } from "@vet/shared";

export const rejectUser = onCall(
  { region: "europe-west8" },
  async (request) => {
    const actorUid = request.auth?.uid;
    const rawCaps = (request.auth?.token?.caps as string[] | undefined) ?? [];
    if (!actorUid || !decodeCaps(rawCaps).includes("users.approve")) {
      throw new HttpsError("permission-denied", "");
    }

    const targetUid = String(request.data?.uid ?? "");
    if (!targetUid) {
      throw new HttpsError("invalid-argument", "");
    }
    if (targetUid === actorUid) {
      throw new HttpsError("failed-precondition", "cannot-reject-self");
    }

    const userSnap = await adminDb.collection("users").doc(targetUid).get();
    if (!userSnap.exists) {
      throw new HttpsError("not-found", "user");
    }

    const now = new Date();
    const actorEmail = (request.auth?.token?.email as string | undefined) ?? "";
    const targetEmail = (userSnap.data()?.["email"] as string | undefined) ?? "";

    await adminDb.collection("users").doc(targetUid).delete();
    try {
      await adminAuth.deleteUser(targetUid);
    } catch (err) {
      logger.warn("auth.rejectUser.authDeleteFailed", { targetUid, err: String(err) });
    }
    await adminDb.collection("audit").add({
      at: now,
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
