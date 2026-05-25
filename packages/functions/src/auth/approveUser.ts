import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { z } from "zod";
import { adminAuth } from "../admin/firebaseAdmin.js";
import { getRepositories } from "../infrastructure/composition.js";
import { decodeCaps, encodeCaps } from "@vet/shared";

const inputSchema = z
  .object({
    uid: z.string().min(1).max(128),
    roleId: z.string().min(1).max(60),
  })
  .strict();

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

    const repos = getRepositories();
    const [user, role] = await Promise.all([
      repos.users.getById(targetUid),
      repos.roles.getById(roleId),
    ]);
    if (!user) throw new HttpsError("not-found", "user");
    if (!role) throw new HttpsError("not-found", "role");

    await repos.users.applyApprovePatch(targetUid, { actorUid, roleId });

    await adminAuth.setCustomUserClaims(targetUid, {
      vet: true,
      roleId,
      caps: encodeCaps(role.capabilities),
      capsVer: Date.now(),
      ...(user.displayName ? { name: user.displayName } : {}),
    });
    await adminAuth.revokeRefreshTokens(targetUid);

    const actorEmail = (request.auth?.token?.email as string | undefined) ?? "";
    await repos.audit.record({
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
