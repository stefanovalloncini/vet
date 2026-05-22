import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions/v2";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "../admin/firebaseAdmin.js";
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

async function nextCapsVer(roleId: string): Promise<number> {
  const ref = adminDb.collection("roles").doc(roleId);
  return adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const prev = (snap.data()?.capsVer as number | undefined) ?? 0;
    const next = prev + 1;
    tx.update(ref, { capsVer: next });
    return next;
  });
}

export const onRoleChange = onDocumentWritten(
  { document: "roles/{roleId}", region: "europe-west8" },
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

    const capsVer = await nextCapsVer(roleId);

    const usersQuery = await adminDb
      .collection("users")
      .where("roleId", "==", roleId)
      .get();

    for (let i = 0; i < usersQuery.docs.length; i += USER_CHUNK_SIZE) {
      const chunk = usersQuery.docs.slice(i, i + USER_CHUNK_SIZE);
      await Promise.all(
        chunk.map(async (userDoc) => {
          const data = userDoc.data() as { displayName?: string };
          const claims = {
            ...computeClaimsForUser({
              roleId,
              capabilities: after.capabilities,
              capsVer,
            }),
            ...(data.displayName ? { name: data.displayName } : {}),
          };
          await adminAuth.setCustomUserClaims(userDoc.id, claims);
          await adminAuth.revokeRefreshTokens(userDoc.id);
          await adminDb.collection("audit").add({
            at: FieldValue.serverTimestamp(),
            actorUid: "system:onRoleChange",
            actorEmail: "system",
            action: "role.update.propagate",
            targetType: "user",
            targetId: userDoc.id,
            details: { roleId, capsVer },
          });
        })
      );
    }

    logger.info("auth.onRoleChange.propagated", {
      roleId,
      capsVer,
      userCount: usersQuery.size,
    });
  }
);
