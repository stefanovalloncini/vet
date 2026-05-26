import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions/v2";
import { adminAuth } from "../admin/firebaseAdmin.js";
import { getRepositories } from "../infrastructure/composition.js";
import type { Capability } from "@vet/shared";
import { encodeCaps } from "@vet/shared";

const USER_CHUNK_SIZE = 10;

interface ComputeInput {
  roleId: string;
  capabilities: Capability[];
  capsVer: number;
}

export function computeClaimsForUser(input: ComputeInput) {
  return {
    vet: true as const,
    roleId: input.roleId,
    caps: encodeCaps(input.capabilities),
    capsVer: input.capsVer,
  };
}

export const onRoleChange = onDocumentWritten(
  {
    document: "roles/{roleId}",
    region: "europe-west8",
    ingressSettings: "ALLOW_INTERNAL_ONLY",
  },
  async (event) => {
    const roleId = event.params.roleId;
    const after = event.data?.after.data() as
      | { capabilities: Capability[]; capsVer?: number }
      | undefined;
    const before = event.data?.before.data() as
      | { capabilities?: Capability[]; capsVer?: number }
      | undefined;
    if (!after) return;

    if (after.capsVer !== undefined && after.capsVer !== before?.capsVer) {
      return;
    }

    const repos = getRepositories();
    const capsVer = await repos.roles.bumpCapsVer(roleId);

    const targets = await repos.users.listByRole(roleId);

    for (let i = 0; i < targets.length; i += USER_CHUNK_SIZE) {
      const chunk = targets.slice(i, i + USER_CHUNK_SIZE);
      await Promise.all(
        chunk.map(async (user) => {
          const claims = {
            ...computeClaimsForUser({
              roleId,
              capabilities: after.capabilities,
              capsVer,
            }),
            ...(user.displayName ? { name: user.displayName } : {}),
          };
          await adminAuth.setCustomUserClaims(user.uid, claims);
          await adminAuth.revokeRefreshTokens(user.uid);
          await repos.audit.record({
            actorUid: "system:onRoleChange",
            actorEmail: "system",
            action: "role.update.propagate",
            targetType: "user",
            targetId: user.uid,
            details: { roleId, capsVer },
          });
        })
      );
    }

    logger.info("auth.onRoleChange.propagated", {
      roleId,
      capsVer,
      userCount: targets.length,
    });
  }
);
