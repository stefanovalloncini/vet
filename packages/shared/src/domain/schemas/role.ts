import { z } from "zod";
import { capabilitySchema } from "../caps/registry.js";

export const roleInputSchema = z
  .object({
    name: z.string().min(1).max(60),
    description: z.string().max(300).optional(),
    capabilities: z.array(capabilitySchema),
  })
  .strict();

export const roleDocSchema = z
  .object({
    name: z.string().min(1).max(60),
    description: z.string().max(300).optional(),
    capabilities: z.array(capabilitySchema),
    locked: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
    createdBy: z.string(),
    updatedBy: z.string(),
    schemaVersion: z.literal(1),
  })
  .strict();

export type RoleInput = z.infer<typeof roleInputSchema>;
export type RoleDoc = z.infer<typeof roleDocSchema>;
