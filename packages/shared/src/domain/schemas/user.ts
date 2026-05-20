import { z } from "zod";

export const userInputSchema = z
  .object({
    email: z.string().email(),
    displayName: z.string().min(1).max(80),
    roleId: z.string().min(1).max(60),
  })
  .strict();

export const userDocSchema = z
  .object({
    email: z.string().email(),
    displayName: z.string().min(1).max(80),
    roleId: z.string().min(1).max(60),
    approved: z.boolean(),
    disabled: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
    lastSignInAt: z.date().optional(),
    approvedAt: z.date().optional(),
    approvedBy: z.string().min(1).max(128).optional(),
    schemaVersion: z.literal(1),
  })
  .strict();

export type UserInput = z.infer<typeof userInputSchema>;
export type UserDoc = z.infer<typeof userDocSchema>;
