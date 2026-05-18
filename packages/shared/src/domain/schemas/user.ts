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
    disabled: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
    lastSignInAt: z.date().optional(),
    schemaVersion: z.literal(1),
  })
  .strict();

export type UserInput = z.infer<typeof userInputSchema>;
export type UserDoc = z.infer<typeof userDocSchema>;
