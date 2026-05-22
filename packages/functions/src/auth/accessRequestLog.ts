import { logger } from "firebase-functions/v2";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "../admin/firebaseAdmin.js";
import { normalizeEmail } from "@vet/shared";

const MAX_ATTEMPTS = 10000;

export interface AccessRequestDecisionInput {
  existing: { attempts?: number } | null;
  email: string;
  emailNorm: string;
  displayName?: string | undefined;
  photoURL?: string | undefined;
  providerId?: string | undefined;
  now: Timestamp;
}

export type AccessRequestDecision =
  | { kind: "create"; doc: Record<string, unknown> }
  | { kind: "update"; patch: Record<string, unknown> }
  | { kind: "storm"; attempts: number };

export function decideAccessRequestUpdate(
  input: AccessRequestDecisionInput
): AccessRequestDecision {
  const optionals = {
    ...(input.displayName ? { displayName: input.displayName } : {}),
    ...(input.photoURL ? { photoURL: input.photoURL } : {}),
    ...(input.providerId ? { providerId: input.providerId } : {}),
  };
  if (!input.existing) {
    return {
      kind: "create",
      doc: {
        emailNorm: input.emailNorm,
        email: input.email,
        ...optionals,
        firstAttemptAt: input.now,
        lastAttemptAt: input.now,
        attempts: 1,
        schemaVersion: 1,
      },
    };
  }
  const prevAttempts = typeof input.existing.attempts === "number"
    ? input.existing.attempts
    : 0;
  if (prevAttempts >= MAX_ATTEMPTS) {
    return { kind: "storm", attempts: prevAttempts };
  }
  return {
    kind: "update",
    patch: {
      email: input.email,
      ...optionals,
      lastAttemptAt: input.now,
      attempts: prevAttempts + 1,
    },
  };
}

export interface RecordAccessRequestInput {
  email: string;
  displayName: string | undefined;
  photoURL: string | undefined;
  providerId: string | undefined;
  source: "beforeUserCreated" | "beforeSignIn";
}

export async function recordAccessRequest(
  input: RecordAccessRequestInput
): Promise<void> {
  const emailNorm = normalizeEmail(input.email);
  const ref = adminDb.collection("accessRequests").doc(emailNorm);
  try {
    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const decision = decideAccessRequestUpdate({
        existing: snap.exists ? (snap.data() ?? null) : null,
        email: input.email,
        emailNorm,
        displayName: input.displayName,
        photoURL: input.photoURL,
        providerId: input.providerId,
        now: Timestamp.now(),
      });
      if (decision.kind === "storm") {
        logger.warn("auth.accessRequest.storm", {
          source: input.source,
          email: emailNorm,
          attempts: decision.attempts,
        });
        return;
      }
      if (decision.kind === "create") {
        tx.set(ref, decision.doc);
        return;
      }
      tx.update(ref, decision.patch);
    });
  } catch (err) {
    logger.error("auth.accessRequest.recordFailed", {
      source: input.source,
      email: emailNorm,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
