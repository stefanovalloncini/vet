import { onCall, HttpsError } from "firebase-functions/v2/https";
import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { adminDb } from "../admin/firebaseAdmin.js";
import { normalizeEmail } from "@vet/shared";

const TICKET_TTL_MS = 15 * 60 * 1000;

const createInputSchema = z
  .object({ email: z.string().min(3).max(120) })
  .strict();

export interface TicketDecision {
  valid: boolean;
  reason?: "missing" | "consumed" | "expired" | "email-mismatch";
}

export function evaluateTicket(input: {
  exists: boolean;
  consumed: boolean | undefined;
  emailNorm: string | undefined;
  expiresAtMs: number | undefined;
  providedEmailNorm: string;
  nowMs: number;
}): TicketDecision {
  if (!input.exists) return { valid: false, reason: "missing" };
  if (input.consumed === true) return { valid: false, reason: "consumed" };
  if (input.emailNorm !== input.providedEmailNorm) {
    return { valid: false, reason: "email-mismatch" };
  }
  if (typeof input.expiresAtMs !== "number" || input.nowMs > input.expiresAtMs) {
    return { valid: false, reason: "expired" };
  }
  return { valid: true };
}

export const createSignInTicket = onCall(
  { region: "europe-west8", cors: true, enforceAppCheck: true },
  async (request) => {
    let email: string;
    try {
      ({ email } = createInputSchema.parse(request.data));
    } catch {
      throw new HttpsError("invalid-argument", "");
    }
    const norm = normalizeEmail(email);
    const ticketId = randomUUID();
    const now = Timestamp.now();
    const expiresAt = Timestamp.fromMillis(now.toMillis() + TICKET_TTL_MS);

    await adminDb.collection("signInTickets").doc(ticketId).set({
      emailNorm: norm,
      createdAt: now,
      expiresAt,
      consumed: false,
    });

    return { ticketId, expiresAtMs: expiresAt.toMillis() };
  }
);

const consumeInputSchema = z
  .object({
    ticketId: z.string().uuid(),
    email: z.string().min(3).max(120),
  })
  .strict();

export const consumeSignInTicket = onCall(
  { region: "europe-west8", cors: true, enforceAppCheck: true },
  async (request) => {
    let parsed;
    try {
      parsed = consumeInputSchema.parse(request.data);
    } catch {
      throw new HttpsError("invalid-argument", "");
    }
    const norm = normalizeEmail(parsed.email);
    const ref = adminDb.collection("signInTickets").doc(parsed.ticketId);

    const decision = await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.exists ? snap.data() ?? undefined : undefined;
      const result = evaluateTicket({
        exists: snap.exists,
        consumed: data?.["consumed"] as boolean | undefined,
        emailNorm: data?.["emailNorm"] as string | undefined,
        expiresAtMs: data
          ? (data["expiresAt"] as Timestamp | undefined)?.toMillis()
          : undefined,
        providedEmailNorm: norm,
        nowMs: Date.now(),
      });
      if (result.valid) {
        tx.update(ref, { consumed: true, consumedAt: Timestamp.now() });
      }
      return result;
    });

    if (!decision.valid) {
      throw new HttpsError("deadline-exceeded", decision.reason ?? "invalid");
    }
    return { ok: true as const };
  }
);
