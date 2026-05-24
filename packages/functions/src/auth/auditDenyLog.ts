import { logger } from "firebase-functions/v2";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "../admin/firebaseAdmin.js";

const MAX_PER_EMAIL_PER_DAY = 10;

export type AuthDenyReason =
  | "missing-email"
  | "allowlist-miss"
  | "role-missing"
  | "provider-not-allowed"
  | "email-not-verified";

export type AuthDenySource = "beforeSignIn" | "beforeUserCreated";

export interface RecordAuthDenyAuditInput {
  emailNorm: string;
  email: string;
  actorUid: string | undefined;
  reason: AuthDenyReason;
  source: AuthDenySource;
  eventType: string | undefined;
}

function dateKey(now: Date): string {
  return now.toISOString().slice(0, 10);
}

export async function recordAuthDenyAudit(
  input: RecordAuthDenyAuditInput
): Promise<void> {
  const now = Timestamp.now();
  const key = dateKey(now.toDate());
  const limitRef = adminDb
    .collection("auditRateLimits")
    .doc(`${input.emailNorm}__${key}`);
  try {
    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(limitRef);
      const count = snap.exists
        ? Number((snap.data() ?? {})["count"] ?? 0)
        : 0;
      if (count >= MAX_PER_EMAIL_PER_DAY) {
        logger.warn("auth.audit.deny.throttled", {
          source: input.source,
          email: input.emailNorm,
          count,
        });
        return;
      }
      tx.set(
        limitRef,
        {
          emailNorm: input.emailNorm,
          date: key,
          count: count + 1,
          lastAt: now,
        },
        { merge: true }
      );
      const auditRef = adminDb.collection("audit").doc();
      tx.set(auditRef, {
        at: now,
        actorUid: input.actorUid ?? "anonymous",
        actorEmail: input.email,
        action: "auth.signIn.deny",
        targetType: "auth",
        targetId: input.emailNorm,
        details: {
          reason: input.reason,
          source: input.source,
          ...(input.eventType !== undefined
            ? { eventType: input.eventType }
            : {}),
        },
      });
    });
  } catch (err) {
    logger.error("auth.audit.deny.failed", {
      source: input.source,
      email: input.emailNorm,
      errorName: err instanceof Error ? err.name : "Unknown",
    });
  }
}
