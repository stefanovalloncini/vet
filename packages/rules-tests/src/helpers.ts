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

export function adminAs(env: RulesTestEnvironment, uid: string) {
  return authedAs(env, uid, [
    "users.read.all",
    "users.approve",
    "roles.read",
    "roles.manage",
    "roles.assign",
    "allowlist.read",
    "allowlist.manage",
    "audit.read",
  ]);
}
