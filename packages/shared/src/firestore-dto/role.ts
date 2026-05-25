import { z } from "zod";
import type { Role } from "../domain/entities/Role.js";
import { capabilitySchema } from "../domain/caps/registry.js";
import type { RoleInput } from "../domain/schemas/role.js";
import {
  timestampLike,
  timestampToDate,
  type SerializerStampDeps,
} from "./_shared.js";

export const roleDtoSchema = z
  .object({
    name: z.string().min(1).max(60),
    description: z.string().max(300).optional(),
    capabilities: z.array(capabilitySchema).max(64),
    locked: z.boolean(),
    capsVer: z.number().int().nonnegative().optional(),
    createdAt: timestampLike,
    updatedAt: timestampLike,
    createdBy: z.string().min(1).max(128),
    updatedBy: z.string().min(1).max(128),
    schemaVersion: z.literal(1),
  })
  .strict();

export type RoleDTO = z.infer<typeof roleDtoSchema>;

export function parseRole(id: string, raw: unknown): Role {
  const dto = roleDtoSchema.parse(raw);
  return {
    id,
    name: dto.name,
    ...(dto.description !== undefined ? { description: dto.description } : {}),
    capabilities: [...dto.capabilities],
    locked: dto.locked,
    ...(dto.capsVer !== undefined ? { capsVer: dto.capsVer } : {}),
    createdAt: timestampToDate(dto.createdAt),
    updatedAt: timestampToDate(dto.updatedAt),
    createdBy: dto.createdBy,
    updatedBy: dto.updatedBy,
    schemaVersion: dto.schemaVersion,
  };
}

export function roleNameKey(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-");
}

export type RoleCreateWritePayload<TServerStamp> = Omit<
  z.input<typeof roleDtoSchema>,
  "createdAt" | "updatedAt"
> & {
  createdAt: TServerStamp;
  updatedAt: TServerStamp;
};

export function buildRoleCreateDoc<TServerStamp>(
  args: { input: RoleInput; actor: string },
  deps: Pick<SerializerStampDeps<unknown, TServerStamp>, "serverTimestamp">
): RoleCreateWritePayload<TServerStamp> {
  const now = deps.serverTimestamp();
  return {
    name: args.input.name,
    ...(args.input.description !== undefined
      ? { description: args.input.description }
      : {}),
    capabilities: [...args.input.capabilities],
    locked: false,
    createdAt: now,
    updatedAt: now,
    createdBy: args.actor,
    updatedBy: args.actor,
    schemaVersion: 1,
  };
}

export interface RoleUpdatePatch<TServerStamp> {
  description?: string;
  capabilities: string[];
  updatedAt: TServerStamp;
  updatedBy: string;
}

export function buildRoleUpdatePatch<TServerStamp>(
  args: { input: RoleInput; actor: string },
  deps: Pick<SerializerStampDeps<unknown, TServerStamp>, "serverTimestamp">
): RoleUpdatePatch<TServerStamp> {
  return {
    ...(args.input.description !== undefined
      ? { description: args.input.description }
      : {}),
    capabilities: [...args.input.capabilities],
    updatedAt: deps.serverTimestamp(),
    updatedBy: args.actor,
  };
}

export type RoleSeedWritePayload<TStamp> = Omit<
  z.input<typeof roleDtoSchema>,
  "createdAt" | "updatedAt"
> & {
  createdAt: TStamp;
  updatedAt: TStamp;
};

export function buildRoleSeedDoc<TStamp, TServerStamp>(
  args: { role: Role },
  deps: SerializerStampDeps<TStamp, TServerStamp>
): RoleSeedWritePayload<TStamp> {
  return {
    name: args.role.name,
    ...(args.role.description !== undefined
      ? { description: args.role.description }
      : {}),
    capabilities: [...args.role.capabilities],
    locked: args.role.locked,
    ...(args.role.capsVer !== undefined ? { capsVer: args.role.capsVer } : {}),
    createdAt: deps.fromDate(args.role.createdAt),
    updatedAt: deps.fromDate(args.role.updatedAt),
    createdBy: args.role.createdBy,
    updatedBy: args.role.updatedBy,
    schemaVersion: 1,
  };
}
