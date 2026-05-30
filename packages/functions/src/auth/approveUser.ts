import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { z } from "zod";
import { adminAuth } from "../admin/firebaseAdmin.js";
import { getRepositories } from "../infrastructure/composition.js";
import { encodeCaps, actorCanAssignRole } from "@vet/shared";
import { readActorClaims } from "./actorClaims.js";
import { ensureRecentAuth } from "./recentAuth.js";

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
    const { email: actorEmail, caps } = readActorClaims(request.auth?.token);
    if (!actorUid || !caps.includes("users.approve")) {
      throw new HttpsError("permission-denied", "");
    }
    ensureRecentAuth(request);

    let targetUid: string;
    let roleId: string;
    try {
      ({ uid: targetUid, roleId } = inputSchema.parse(request.data));
    } catch {
      throw new HttpsError("invalid-argument", "");
    }
    if (roleId === "admin") {
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
    if (!actorCanAssignRole(role.capabilities, caps)) {
      throw new HttpsError("permission-denied", "");
    }

    const capsVer = Date.now();

    await repos.run(async (tx) => {
      await tx.users.applyApprovePatch(targetUid, { actorUid, roleId });
      await tx.users.applyRevokeSessionPatch(targetUid, { minCapsVer: capsVer });
      await tx.audit.record({
        actorUid,
        actorEmail,
        action: "user.approve",
        targetType: "user",
        targetId: targetUid,
        details: { roleId },
      });
    });

    await adminAuth.setCustomUserClaims(targetUid, {
      vet: true,
      roleId,
      caps: encodeCaps(role.capabilities),
      capsVer,
      ...(user.displayName ? { name: user.displayName } : {}),
    });
    await adminAuth.revokeRefreshTokens(targetUid);

    logger.info("auth.approveUser", { actorUid, targetUid, roleId });

    return { ok: true as const };
  }
);
