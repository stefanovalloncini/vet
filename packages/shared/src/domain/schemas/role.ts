import { z } from "zod";
import { capabilitySchema } from "../caps/registry.js";

export const roleInputSchema = z
  .object({
    name: z.string().min(1).max(60),
    description: z.string().max(300).optional(),
    capabilities: z.array(capabilitySchema).max(64),
  })
  .strict();

export const roleDocSchema = z
  .object({
    name: z.string().min(1).max(60),
    description: z.string().max(300).optional(),
    capabilities: z.array(capabilitySchema).max(64),
    locked: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
    createdBy: z.string().min(1).max(128),
    updatedBy: z.string().min(1).max(128),
    capsVer: z.number().int().nonnegative().optional(),
    schemaVersion: z.literal(1),
  })
  .strict();

export type RoleInput = z.infer<typeof roleInputSchema>;
export type RoleDoc = z.infer<typeof roleDocSchema>;
