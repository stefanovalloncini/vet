import { z } from "zod";
import type { User } from "../domain/entities/User.js";
import { safeEmail } from "../domain/schemas/safeString.js";
import {
  timestampLike,
  timestampToDate,
  type SerializerStampDeps,
} from "./_shared.js";

export const userDtoSchema = z
  .object({
    email: safeEmail(120),
    displayName: z.string().min(1).max(80),
    roleId: z.string().min(1).max(60),
    approved: z.boolean(),
    disabled: z.boolean(),
    createdAt: timestampLike,
    updatedAt: timestampLike,
    lastSignInAt: timestampLike.optional(),
    approvedAt: timestampLike.optional(),
    approvedBy: z.string().min(1).max(128).optional(),
    minCapsVer: z.number().int().nonnegative().optional(),
    schemaVersion: z.literal(1),
  })
  .strict();

export type UserDTO = z.infer<typeof userDtoSchema>;

export function parseUser(uid: string, raw: unknown): User {
  const dto = userDtoSchema.parse(raw);
  return {
    uid,
    email: dto.email,
    displayName: dto.displayName,
    roleId: dto.roleId,
    approved: dto.approved,
    disabled: dto.disabled,
    createdAt: timestampToDate(dto.createdAt),
    updatedAt: timestampToDate(dto.updatedAt),
    ...(dto.lastSignInAt !== undefined
      ? { lastSignInAt: timestampToDate(dto.lastSignInAt) }
      : {}),
    ...(dto.approvedAt !== undefined
      ? { approvedAt: timestampToDate(dto.approvedAt) }
      : {}),
    ...(dto.approvedBy !== undefined ? { approvedBy: dto.approvedBy } : {}),
    ...(dto.minCapsVer !== undefined ? { minCapsVer: dto.minCapsVer } : {}),
    schemaVersion: dto.schemaVersion,
  };
}

export interface UserSignInPatchArgs {
  email: string;
  displayName: string;
  isFirst: boolean;
  defaultRoleId: string;
}

export interface UserSignInPatch<TServerStamp> {
  email: string;
  displayName: string;
  disabled: false;
  updatedAt: TServerStamp;
  lastSignInAt: TServerStamp;
  schemaVersion: 1;
  createdAt?: TServerStamp;
  approved?: false;
  roleId?: string;
}

export function buildUserSignInPatch<TServerStamp>(
  args: UserSignInPatchArgs,
  deps: Pick<SerializerStampDeps<unknown, TServerStamp>, "serverTimestamp">
): UserSignInPatch<TServerStamp> {
  const now = deps.serverTimestamp();
  const base: UserSignInPatch<TServerStamp> = {
    email: args.email,
    displayName: args.displayName,
    disabled: false,
    updatedAt: now,
    lastSignInAt: now,
    schemaVersion: 1,
  };
  if (args.isFirst) {
    base.createdAt = now;
    base.approved = false;
    base.roleId = args.defaultRoleId;
  }
  return base;
}

export interface UserApprovePatchArgs {
  actorUid: string;
  roleId: string;
}

export interface UserApprovePatch<TServerStamp> {
  approved: true;
  roleId: string;
  approvedAt: TServerStamp;
  approvedBy: string;
  updatedAt: TServerStamp;
}

export function buildUserApprovePatch<TServerStamp>(
  args: UserApprovePatchArgs,
  deps: Pick<SerializerStampDeps<unknown, TServerStamp>, "serverTimestamp">
): UserApprovePatch<TServerStamp> {
  const now = deps.serverTimestamp();
  return {
    approved: true,
    roleId: args.roleId,
    approvedAt: now,
    approvedBy: args.actorUid,
    updatedAt: now,
  };
}

export interface UserRevokeSessionPatchArgs {
  disabled?: boolean;
  approved?: boolean;
  minCapsVer: number;
}

export interface UserRevokeSessionPatch<TServerStamp> {
  minCapsVer: number;
  updatedAt: TServerStamp;
  disabled?: boolean;
  approved?: boolean;
}

export function buildUserRevokeSessionPatch<TServerStamp>(
  args: UserRevokeSessionPatchArgs,
  deps: Pick<SerializerStampDeps<unknown, TServerStamp>, "serverTimestamp">
): UserRevokeSessionPatch<TServerStamp> {
  return {
    minCapsVer: args.minCapsVer,
    updatedAt: deps.serverTimestamp(),
    ...(args.disabled !== undefined ? { disabled: args.disabled } : {}),
    ...(args.approved !== undefined ? { approved: args.approved } : {}),
  };
}
