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
