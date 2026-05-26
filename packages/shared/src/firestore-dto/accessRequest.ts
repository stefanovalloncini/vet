import { z } from "zod";
import type { AccessRequest } from "../domain/entities/AccessRequest.js";
import { safeEmail } from "../domain/schemas/safeString.js";
import { timestampLike, timestampToDate } from "./_shared.js";

export const accessRequestDtoSchema = z
  .object({
    emailNorm: z.string().min(3).max(120),
    email: safeEmail(120),
    displayName: z.string().max(120).optional(),
    photoURL: z.string().url().max(500).optional(),
    providerId: z.string().max(60).optional(),
    firstAttemptAt: timestampLike,
    lastAttemptAt: timestampLike,
    expiresAt: timestampLike.optional(),
    attempts: z.number().int().min(1).max(10000),
    schemaVersion: z.literal(1),
  })
  .strict();

export type AccessRequestDTO = z.infer<typeof accessRequestDtoSchema>;

export function parseAccessRequest(
  emailNorm: string,
  raw: unknown
): AccessRequest {
  const dto = accessRequestDtoSchema.parse(raw);
  return {
    emailNorm,
    email: dto.email,
    ...(dto.displayName !== undefined ? { displayName: dto.displayName } : {}),
    ...(dto.photoURL !== undefined ? { photoURL: dto.photoURL } : {}),
    ...(dto.providerId !== undefined ? { providerId: dto.providerId } : {}),
    firstAttemptAt: timestampToDate(dto.firstAttemptAt),
    lastAttemptAt: timestampToDate(dto.lastAttemptAt),
    attempts: dto.attempts,
    schemaVersion: dto.schemaVersion,
  };
}

export const STORM_THRESHOLD = 100;
const HARD_CAP = 10000;

export interface AccessRequestRecordInput {
  email: string;
  emailNorm: string;
  displayName?: string | undefined;
  photoURL?: string | undefined;
  providerId?: string | undefined;
}

export interface AccessRequestExisting {
  attempts?: number;
}

export type AccessRequestDecision<TStamp> =
  | { kind: "create"; doc: Record<string, unknown> }
  | { kind: "update"; patch: Record<string, unknown> }
  | {
      kind: "storm";
      attempts: number;
      patch: { lastAttemptAt: TStamp; expiresAt?: TStamp };
    }
  | { kind: "capped"; attempts: number };

export function decideAccessRequestUpdate<TStamp>(input: {
  existing: AccessRequestExisting | null;
  input: AccessRequestRecordInput;
  now: TStamp;
  expiresAt?: TStamp;
}): AccessRequestDecision<TStamp> {
  const optionals = {
    ...(input.input.displayName ? { displayName: input.input.displayName } : {}),
    ...(input.input.photoURL ? { photoURL: input.input.photoURL } : {}),
    ...(input.input.providerId ? { providerId: input.input.providerId } : {}),
  };
  const ttlField = input.expiresAt !== undefined
    ? { expiresAt: input.expiresAt }
    : {};
  if (!input.existing) {
    return {
      kind: "create",
      doc: {
        emailNorm: input.input.emailNorm,
        email: input.input.email,
        ...optionals,
        firstAttemptAt: input.now,
        lastAttemptAt: input.now,
        ...ttlField,
        attempts: 1,
        schemaVersion: 1,
      },
    };
  }
  const prevAttempts =
    typeof input.existing.attempts === "number" ? input.existing.attempts : 0;
  if (prevAttempts >= HARD_CAP) {
    return { kind: "capped", attempts: prevAttempts };
  }
  if (prevAttempts >= STORM_THRESHOLD) {
    return {
      kind: "storm",
      attempts: prevAttempts,
      patch: { lastAttemptAt: input.now, ...ttlField },
    };
  }
  return {
    kind: "update",
    patch: {
      email: input.input.email,
      ...optionals,
      lastAttemptAt: input.now,
      ...ttlField,
      attempts: prevAttempts + 1,
    },
  };
}

export const TTL_DAYS = 90;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function computeExpiresAtMillis(nowMillis: number): number {
  return nowMillis + TTL_DAYS * MS_PER_DAY;
}
