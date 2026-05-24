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
  "users.approve",
  "payments.read",
  "payments.read.any",
  "payments.manage",
  "payments.manage.any",
  "conti.proforma",
  "conti.emit",
  "conti.saldo",
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

const CAP_CODES: Record<Capability, string> = {
  "activities.read.all": "ara",
  "activities.create": "ac",
  "activities.update.own": "auo",
  "activities.update.any": "aua",
  "activities.delete.own": "ado",
  "activities.delete.any": "ada",
  "activities.export": "ae",
  "aziende.read": "zr",
  "aziende.create": "zc",
  "aziende.update": "zu",
  "aziende.delete": "zd",
  "activity_types.read": "tr",
  "activity_types.manage": "tm",
  "trash.read.own": "hro",
  "trash.read.any": "hra",
  "trash.restore.own": "hso",
  "trash.restore.any": "hsa",
  "trash.purge": "hp",
  "roles.read": "rr",
  "roles.manage": "rm",
  "roles.assign": "rsg",
  "allowlist.read": "lr",
  "allowlist.manage": "lm",
  "audit.read": "ur",
  "users.read.all": "usr",
  "users.approve": "uap",
  "payments.read": "pr",
  "payments.read.any": "pra",
  "payments.manage": "pm",
  "payments.manage.any": "pma",
  "conti.proforma": "cp",
  "conti.emit": "ce",
  "conti.saldo": "cs",
  "reminders.read": "mr",
  "reminders.create": "mc",
  "reminders.update.own": "muo",
  "reminders.update.any": "mua",
  "reminders.delete.own": "mdo",
  "reminders.delete.any": "mda",
};

const CAP_BY_CODE: Record<string, Capability> = Object.fromEntries(
  (Object.entries(CAP_CODES) as Array<[Capability, string]>).map(
    ([name, code]) => [code, name]
  )
);

export function encodeCaps(caps: ReadonlyArray<Capability>): string[] {
  return caps.map((c) => CAP_CODES[c]);
}

export function decodeCaps(codes: ReadonlyArray<string>): Capability[] {
  const out: Capability[] = [];
  for (const code of codes) {
    const cap = CAP_BY_CODE[code] ?? (isCapability(code) ? code : undefined);
    if (cap) out.push(cap);
  }
  return out;
}

export function capCode(cap: Capability): string {
  return CAP_CODES[cap];
}
