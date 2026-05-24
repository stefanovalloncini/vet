import { z } from "zod";
import { safeEmail } from "./safeString.js";

export const allowlistEntryInputSchema = z
  .object({
    email: safeEmail(120),
    defaultRoleId: z.string().min(1).max(60),
    notes: z.string().max(500).optional(),
  })
  .strict();

export const allowlistEntryDocSchema = z
  .object({
    email: safeEmail(120),
    defaultRoleId: z.string().min(1).max(60),
    invitedBy: z.string().min(1).max(128),
    invitedAt: z.date(),
    notes: z.string().max(500).optional(),
    schemaVersion: z.literal(1),
  })
  .strict();

export type AllowlistEntryInput = z.infer<typeof allowlistEntryInputSchema>;
export type AllowlistEntryDoc = z.infer<typeof allowlistEntryDocSchema>;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
