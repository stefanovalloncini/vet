import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "../admin/firebaseAdmin.js";
import { getAuditRepository } from "../infrastructure/composition.js";
import {
  acceptAccessRequestInputSchema,
  decodeCaps,
  normalizeEmail,
} from "@vet/shared";

interface BuildAllowlistInput {
  email: string;
  roleId: string;
  actorUid: string;
  now: Timestamp;
}

export function buildAllowlistEntry(input: BuildAllowlistInput) {
  return {
    email: input.email,
    defaultRoleId: input.roleId,
    invitedBy: input.actorUid,
    invitedAt: input.now,
    schemaVersion: 1,
  };
}

export const acceptAccessRequest = onCall(
  { region: "europe-west8", enforceAppCheck: true },
  async (request) => {
    const actorUid = request.auth?.uid;
    const rawCaps = (request.auth?.token?.caps as string[] | undefined) ?? [];
    if (!actorUid || !decodeCaps(rawCaps).includes("allowlist.manage")) {
      throw new HttpsError("permission-denied", "");
    }

    let input;
    try {
      input = acceptAccessRequestInputSchema.parse(request.data);
    } catch {
      throw new HttpsError("invalid-argument", "");
    }

    const emailNorm = normalizeEmail(input.email);
    const requestRef = adminDb.collection("accessRequests").doc(emailNorm);
    const allowRef = adminDb.collection("allowlist").doc(emailNorm);
    const roleRef = adminDb.collection("roles").doc(input.roleId);

    const now = Timestamp.now();
    const actorEmail = (request.auth?.token?.email as string | undefined) ?? "";

    await adminDb.runTransaction(async (tx) => {
      const [requestSnap, roleSnap, allowSnap] = await Promise.all([
        tx.get(requestRef),
        tx.get(roleRef),
        tx.get(allowRef),
      ]);
      if (!requestSnap.exists) {
        throw new HttpsError("not-found", "");
      }
      if (!roleSnap.exists) {
        throw new HttpsError("failed-precondition", "");
      }
      if (!allowSnap.exists) {
        tx.set(
          allowRef,
          buildAllowlistEntry({
            email: input.email,
            roleId: input.roleId,
            actorUid,
            now,
          })
        );
      }
      tx.delete(requestRef);
    });

    await getAuditRepository().record({
      actorUid,
      actorEmail,
      action: "access_request.accept",
      targetType: "access_request",
      targetId: emailNorm,
      details: { roleId: input.roleId, email: input.email },
    });

    logger.info("auth.acceptAccessRequest", {
      actorUid,
      email: emailNorm,
      roleId: input.roleId,
    });

    return { ok: true as const };
  }
);
