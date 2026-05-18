import { z } from "zod";

export const allowlistEntryInputSchema = z
  .object({
    email: z.string().email(),
    defaultRoleId: z.string().min(1).max(60),
    notes: z.string().max(500).optional(),
  })
  .strict();

export const allowlistEntryDocSchema = z
  .object({
    email: z.string().email(),
    defaultRoleId: z.string().min(1).max(60),
    invitedBy: z.string(),
    invitedAt: z.date(),
    notes: z.string().max(500).optional(),
  })
  .strict();

export type AllowlistEntryInput = z.infer<typeof allowlistEntryInputSchema>;
export type AllowlistEntryDoc = z.infer<typeof allowlistEntryDocSchema>;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
