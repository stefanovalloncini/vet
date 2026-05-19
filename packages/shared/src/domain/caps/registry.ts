import { z } from "zod";

export const CAPABILITIES = [
  "activities.read.all",
  "activities.create",
  "activities.update.own",
  "activities.update.any",
  "activities.delete.own",
  "activities.delete.any",
  "activities.export",
  "aziende.read",
  "aziende.create",
  "aziende.update",
  "aziende.delete",
  "activity_types.read",
  "activity_types.manage",
  "trash.read.own",
  "trash.read.any",
  "trash.restore.own",
  "trash.restore.any",
  "trash.purge",
  "roles.read",
  "roles.manage",
  "roles.assign",
  "allowlist.read",
  "allowlist.manage",
  "audit.read",
  "users.read.all",
  "payments.read",
  "payments.manage",
  "reminders.read",
  "reminders.create",
  "reminders.update.own",
  "reminders.update.any",
  "reminders.delete.own",
  "reminders.delete.any",
] as const;

export type Capability = (typeof CAPABILITIES)[number];

const capabilitySet = new Set<string>(CAPABILITIES);

export const capabilitySchema = z.enum(CAPABILITIES);

export function isCapability(value: unknown): value is Capability {
  return typeof value === "string" && capabilitySet.has(value);
}
