import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import type { Capability } from "@vet/shared";
import { encodeCaps } from "@vet/shared";

interface ExtraClaims {
  roleId?: string;
  email?: string;
  name?: string;
}

const TEST_DISPLAY_NAMES: Record<string, string> = {
  u: "U",
  "owner-uid": "Owner",
  "other-uid": "Other",
  admin: "Admin",
  a: "Admin",
};

export function authedAs(
  env: RulesTestEnvironment,
  uid: string,
  caps: Capability[] = [],
  extra: ExtraClaims = {}
) {
  return env
    .authenticatedContext(uid, {
      vet: true,
      caps: encodeCaps(caps),
      roleId: extra.roleId ?? "vet",
      capsVer: 1,
      email: extra.email ?? `${uid}@example.com`,
      name: extra.name !== undefined ? extra.name : (TEST_DISPLAY_NAMES[uid] ?? uid),
    })
    .firestore();
}

export const VETERINARIO_SEMPLICE_CAPS: ReadonlyArray<Capability> = [
  "activities.read.all",
  "activities.create",
  "activities.update.own",
  "activities.delete.own",
  "activities.export",
  "aziende.read",
  "aziende.create",
  "aziende.update",
  "activity_types.read",
  "trash.read.own",
  "trash.restore.own",
  "conti.proforma",
  "reminders.read",
  "reminders.create",
  "reminders.update.own",
  "reminders.delete.own",
];

export const TITOLARE_CAPS: ReadonlyArray<Capability> = [
  ...VETERINARIO_SEMPLICE_CAPS,
  "conti.emit",
  "conti.saldo",
];

export const AMMINISTRATORE_CAPS: ReadonlyArray<Capability> = [
  ...TITOLARE_CAPS,
  "activity_types.manage",
  "roles.read",
  "roles.manage",
  "roles.assign",
  "allowlist.read",
  "allowlist.manage",
  "users.approve",
  "users.read.all",
  "audit.read",
];

export function asVeterinarioSemplice(env: RulesTestEnvironment, uid: string) {
  return authedAs(env, uid, [...VETERINARIO_SEMPLICE_CAPS], {
    roleId: "veterinario_semplice",
  });
}

export function asTitolare(env: RulesTestEnvironment, uid: string) {
  return authedAs(env, uid, [...TITOLARE_CAPS], {
    roleId: "titolare",
  });
}

export function asAmministratore(env: RulesTestEnvironment, uid: string) {
  return authedAs(env, uid, [...AMMINISTRATORE_CAPS], {
    roleId: "amministratore",
  });
}

export function adminAs(env: RulesTestEnvironment, uid: string) {
  return asAmministratore(env, uid);
}
