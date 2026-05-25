import { z } from "zod";
import type { AllowlistEntry } from "../domain/entities/AllowlistEntry.js";
import type { AllowlistEntryInput } from "../domain/schemas/allowlist.js";
import { safeEmail } from "../domain/schemas/safeString.js";
import {
  timestampLike,
  timestampToDate,
  type SerializerStampDeps,
} from "./_shared.js";

export const allowlistEntryDtoSchema = z
  .object({
    email: safeEmail(120),
    defaultRoleId: z.string().min(1).max(60),
    invitedBy: z.string().min(1).max(128),
    invitedAt: timestampLike,
    notes: z.string().max(500).optional(),
    schemaVersion: z.literal(1),
  })
  .strict();

export type AllowlistEntryDTO = z.infer<typeof allowlistEntryDtoSchema>;

export function parseAllowlistEntry(
  emailNorm: string,
  raw: unknown
): AllowlistEntry {
  const dto = allowlistEntryDtoSchema.parse(raw);
  return {
    emailNorm,
    email: dto.email,
    defaultRoleId: dto.defaultRoleId,
    invitedBy: dto.invitedBy,
    invitedAt: timestampToDate(dto.invitedAt),
    ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
    schemaVersion: dto.schemaVersion,
  };
}

export type AllowlistEntryAddWritePayload<TServerStamp> = Omit<
  z.input<typeof allowlistEntryDtoSchema>,
  "invitedAt"
> & {
  invitedAt: TServerStamp;
};

export function buildAllowlistEntryAddDoc<TStamp, TServerStamp>(
  args: { input: AllowlistEntryInput; actor: string },
  deps: SerializerStampDeps<TStamp, TServerStamp>
): AllowlistEntryAddWritePayload<TServerStamp> {
  return {
    email: args.input.email,
    defaultRoleId: args.input.defaultRoleId,
    invitedBy: args.actor,
    invitedAt: deps.serverTimestamp(),
    ...(args.input.notes !== undefined ? { notes: args.input.notes } : {}),
    schemaVersion: 1,
  };
}
