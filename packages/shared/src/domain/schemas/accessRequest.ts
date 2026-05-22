import { z } from "zod";

export const accessRequestDocSchema = z
  .object({
    emailNorm: z.string().min(3).max(120),
    email: z.string().email().max(120),
    displayName: z.string().max(120).optional(),
    photoURL: z.string().url().max(500).optional(),
    providerId: z.string().max(60).optional(),
    firstAttemptAt: z.date(),
    lastAttemptAt: z.date(),
    attempts: z.number().int().min(1).max(10000),
    schemaVersion: z.literal(1),
  })
  .strict();

export const acceptAccessRequestInputSchema = z
  .object({
    email: z.string().email().max(120),
    roleId: z.string().min(1).max(60),
  })
  .strict();

export const rejectAccessRequestInputSchema = z
  .object({
    email: z.string().email().max(120),
  })
  .strict();

export type AccessRequestDoc = z.infer<typeof accessRequestDocSchema>;
export type AcceptAccessRequestInput = z.infer<typeof acceptAccessRequestInputSchema>;
export type RejectAccessRequestInput = z.infer<typeof rejectAccessRequestInputSchema>;
