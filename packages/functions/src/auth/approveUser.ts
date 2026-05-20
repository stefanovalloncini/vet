import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { adminAuth, adminDb } from "../admin/firebaseAdmin.js";
import { decodeCaps, encodeCaps, type Capability } from "@vet/shared";

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
  { region: "europe-west8" },
  async (request) => {
    const actorUid = request.auth?.uid;
    const rawCaps = (request.auth?.token?.caps as string[] | undefined) ?? [];
    if (!actorUid || !decodeCaps(rawCaps).includes("users.approve")) {
      throw new HttpsError("permission-denied", "");
    }

    const targetUid = String(request.data?.uid ?? "");
    const roleId = String(request.data?.roleId ?? "");
    if (!targetUid || !roleId) {
      throw new HttpsError("invalid-argument", "");
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
