import { onDocumentDeleted } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions/v2";
import { adminAuth, adminDb } from "../admin/firebaseAdmin.js";
import { getAuditRepository } from "../infrastructure/composition.js";

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
    await Promise.all([
      adminAuth.revokeRefreshTokens(uid),
      adminAuth.setCustomUserClaims(uid, null),
      adminAuth.updateUser(uid, { disabled: true }),
      adminDb
        .collection("users")
        .doc(uid)
        .set(
          {
            disabled: true,
            approved: false,
            minCapsVer: Date.now(),
            updatedAt: new Date(),
          },
          { merge: true }
        ),
      getAuditRepository().record({
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
  { document: "allowlist/{emailNorm}", region: "europe-west8" },
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
