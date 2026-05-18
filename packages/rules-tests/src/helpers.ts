import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import type { Capability } from "@vet/shared";

interface ExtraClaims {
  roleId?: string;
}

export function authedAs(
  env: RulesTestEnvironment,
  uid: string,
  caps: Capability[] = [],
  extra: ExtraClaims = {}
) {
  return env
    .authenticatedContext(uid, {
      vet: true,
      caps,
      roleId: extra.roleId ?? "vet",
      capsVer: 1,
    })
    .firestore();
}

export function adminAs(env: RulesTestEnvironment, uid: string) {
  return authedAs(env, uid, [
    "users.read.all",
    "roles.read",
    "roles.manage",
    "roles.assign",
    "allowlist.read",
    "allowlist.manage",
    "audit.read",
  ]);
}
