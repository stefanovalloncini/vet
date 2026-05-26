import { onDocumentDeleted } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions/v2";
import { adminAuth } from "../admin/firebaseAdmin.js";
import { getRepositories } from "../infrastructure/composition.js";

export interface AllowlistDeleteRevocation {
  uid: string | null;
  reason:
    | "missing-email-in-doc"
    | "user-not-found"
    | "revoked"
    | "unexpected-error";
}

export async function revokeForDeletedAllowlistEntry(args: {
  email: string | undefined;
  emailNorm: string;
}): Promise<AllowlistDeleteRevocation> {
  const email = args.email ?? args.emailNorm;
  if (!email) return { uid: null, reason: "missing-email-in-doc" };

  try {
    const userRecord = await adminAuth.getUserByEmail(email);
    const uid = userRecord.uid;
    const repos = getRepositories();
    await Promise.all([
      adminAuth.revokeRefreshTokens(uid),
      adminAuth.setCustomUserClaims(uid, null),
      adminAuth.updateUser(uid, { disabled: true }),
      repos.users.applyRevokeSessionPatch(uid, {
        disabled: true,
        approved: false,
        minCapsVer: Date.now(),
      }),
      repos.audit.record({
        actorUid: "system:onAllowlistDelete",
        actorEmail: "system",
        action: "allowlist.delete.cascade",
        targetType: "user",
        targetId: uid,
        details: { email },
      }),
    ]);
    return { uid, reason: "revoked" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("no user record") || msg.includes("user-not-found")) {
      return { uid: null, reason: "user-not-found" };
    }
    throw err;
  }
}

export const onAllowlistDelete = onDocumentDeleted(
  {
    document: "allowlist/{emailNorm}",
    region: "europe-west8",
    ingressSettings: "ALLOW_INTERNAL_ONLY",
  },
  async (event) => {
    const emailNorm = event.params.emailNorm;
    const data = event.data?.data() as { email?: string } | undefined;
    const result = await revokeForDeletedAllowlistEntry({
      email: data?.email,
      emailNorm,
    });
    logger.info("allowlist.delete.cascade", {
      emailNorm,
      uid: result.uid,
      reason: result.reason,
    });
  }
);
