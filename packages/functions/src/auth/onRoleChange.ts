import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { adminAuth, adminDb } from "../admin/firebaseAdmin.js";
import type { Capability } from "@vet/shared";

interface ComputeInput {
  roleId: string;
  capabilities: Capability[];
  capsVer: number;
}

export function computeClaimsForUser(input: ComputeInput) {
  return {
    vet: true as const,
    roleId: input.roleId,
    caps: input.capabilities,
    capsVer: input.capsVer,
  };
}

export const onRoleChange = onDocumentWritten(
  { document: "roles/{roleId}", region: "europe-west8" },
  async (event) => {
    const roleId = event.params.roleId;
    const after = event.data?.after.data() as
      | { capabilities: Capability[] }
      | undefined;
    if (!after) return;

    const usersQuery = await adminDb
      .collection("users")
      .where("roleId", "==", roleId)
      .get();

    const capsVer = Date.now();
    const ops: Array<Promise<unknown>> = [];

    for (const userDoc of usersQuery.docs) {
      const claims = computeClaimsForUser({
        roleId,
        capabilities: after.capabilities,
        capsVer,
      });
      ops.push(adminAuth.setCustomUserClaims(userDoc.id, claims));
      ops.push(adminAuth.revokeRefreshTokens(userDoc.id));
      ops.push(
        adminDb.collection("audit").add({
          at: new Date(),
          actorUid: "system:onRoleChange",
          actorEmail: "system",
          action: "role.update.propagate",
          targetType: "user",
          targetId: userDoc.id,
          details: { roleId, capsVer },
        })
      );
    }

    await Promise.all(ops);
  }
);
