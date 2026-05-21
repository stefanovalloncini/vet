import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { z } from "zod";
import { adminAuth, adminDb } from "../admin/firebaseAdmin.js";
import { decodeCaps, encodeCaps, type Capability } from "@vet/shared";

const inputSchema = z
  .object({
    uid: z.string().min(1).max(128),
    roleId: z.string().min(1).max(60),
  })
  .strict();

interface BuildInput {
  actorUid: string;
  roleId: string;
  now: Date;
}

export function buildApprovePatch(input: BuildInput) {
  return {
    approved: true,
    roleId: input.roleId,
    approvedAt: input.now,
    approvedBy: input.actorUid,
    updatedAt: input.now,
  };
}

export const approveUser = onCall(
  { region: "europe-west8", enforceAppCheck: true },
  async (request) => {
    const actorUid = request.auth?.uid;
    const rawCaps = (request.auth?.token?.caps as string[] | undefined) ?? [];
    if (!actorUid || !decodeCaps(rawCaps).includes("users.approve")) {
      throw new HttpsError("permission-denied", "");
    }

    let targetUid: string;
    let roleId: string;
    try {
      ({ uid: targetUid, roleId } = inputSchema.parse(request.data));
    } catch {
      throw new HttpsError("invalid-argument", "");
    }
    if (targetUid === actorUid) {
      throw new HttpsError("permission-denied", "");
    }

    const [userSnap, roleSnap] = await Promise.all([
      adminDb.collection("users").doc(targetUid).get(),
      adminDb.collection("roles").doc(roleId).get(),
    ]);
    if (!userSnap.exists) throw new HttpsError("not-found", "user");
    if (!roleSnap.exists) throw new HttpsError("not-found", "role");
    const role = roleSnap.data() as { capabilities: Capability[] };

    const now = new Date();
    await adminDb.collection("users").doc(targetUid).set(
      buildApprovePatch({ actorUid, roleId, now }),
      { merge: true }
    );

    const userData = userSnap.data() ?? {};
    const displayName = typeof userData["displayName"] === "string"
      ? (userData["displayName"] as string)
      : undefined;
    await adminAuth.setCustomUserClaims(targetUid, {
      vet: true,
      roleId,
      caps: encodeCaps(role.capabilities),
      capsVer: Date.now(),
      ...(displayName ? { name: displayName } : {}),
    });
    await adminAuth.revokeRefreshTokens(targetUid);

    const actorEmail = (request.auth?.token?.email as string | undefined) ?? "";
    await adminDb.collection("audit").add({
      at: now,
      actorUid,
      actorEmail,
      action: "user.approve",
      targetType: "user",
      targetId: targetUid,
      details: { roleId },
    });

    logger.info("auth.approveUser", { actorUid, targetUid, roleId });

    return { ok: true as const };
  }
);
