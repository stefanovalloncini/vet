import { logger } from "firebase-functions/v2";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { buildAuditDoc } from "@vet/shared";
import { adminDb } from "../admin/firebaseAdmin.js";

const MAX_PER_EMAIL_PER_DAY = 10;
const GLOBAL_DENY_PER_DAY = 5000;

export type AuthDenyReason =
  | "missing-email"
  | "allowlist-miss"
  | "role-missing"
  | "provider-not-allowed"
  | "email-not-verified"
  | "ticket-invalid";

export type AuthDenySource = "beforeSignIn" | "beforeUserCreated";

export interface RecordAuthDenyAuditInput {
  emailNorm: string;
  email: string;
  actorUid: string | undefined;
  reason: AuthDenyReason;
  source: AuthDenySource;
  eventType: string | undefined;
}

export function dateKey(now: Date): string {
  return now.toISOString().slice(0, 10);
}

export function isAuditThrottled(count: number): boolean {
  return count >= MAX_PER_EMAIL_PER_DAY;
}

/**
 * Global daily ceiling on deny-audit writes. The per-email cap is trivially
 * defeated by rotating attacker-controlled emails on this pre-auth surface; the
 * global cap bounds the total Firestore writes per day (cost containment),
 * mirroring logAppCheckFailure's GLOBAL_DAILY_CAP.
 */
export function isGlobalDenyCapExceeded(count: number): boolean {
  return count >= GLOBAL_DENY_PER_DAY;
}

export async function recordAuthDenyAudit(
  input: RecordAuthDenyAuditInput
): Promise<void> {
  const now = Timestamp.now();
  const key = dateKey(now.toDate());
  const limitRef = adminDb
    .collection("auditRateLimits")
    .doc(`${input.emailNorm}__${key}`);
  const globalRef = adminDb
    .collection("auditRateLimits")
    .doc(`global__${key}`);
  try {
    await adminDb.runTransaction(async (tx) => {
      const [snap, globalSnap] = await Promise.all([
        tx.get(limitRef),
        tx.get(globalRef),
      ]);
      const count = snap.exists
        ? Number((snap.data() ?? {})["count"] ?? 0)
        : 0;
      const globalCount = globalSnap.exists
        ? Number((globalSnap.data() ?? {})["count"] ?? 0)
        : 0;
      if (isAuditThrottled(count)) {
        logger.warn("auth.audit.deny.throttled", {
          source: input.source,
          email: input.emailNorm,
          count,
        });
        return;
      }
      if (isGlobalDenyCapExceeded(globalCount)) {
        logger.warn("auth.audit.deny.globalCap", {
          source: input.source,
          count: globalCount,
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
      tx.set(
        globalRef,
        { date: key, count: globalCount + 1, lastAt: now },
        { merge: true }
      );
      const auditRef = adminDb.collection("audit").doc();
      tx.set(
        auditRef,
        buildAuditDoc(
          {
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
          },
          { serverTimestamp: () => FieldValue.serverTimestamp() }
        )
      );
    });
  } catch (err) {
    logger.error("auth.audit.deny.failed", {
      source: input.source,
      email: input.emailNorm,
      errorName: err instanceof Error ? err.name : "Unknown",
    });
  }
}
