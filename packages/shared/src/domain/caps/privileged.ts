import type { Capability } from "./registry.js";

/**
 * Capabilities that let a holder grant power to other accounts. A role carrying
 * any of these is "privileged": assigning such a role to a user (via approve,
 * role-reassignment, or an allowlist invite) is itself an escalation and must be
 * gated. This list is the shared contract; firestore.rules mirrors it in
 * roleIsPrivileged() and the two MUST stay in sync.
 */
export const PRIVILEGED_CAPABILITIES = [
  "roles.manage",
  "roles.assign",
  "allowlist.manage",
  "users.approve",
] as const satisfies ReadonlyArray<Capability>;

export function roleHasPrivilegedCaps(
  capabilities: ReadonlyArray<Capability>
): boolean {
  const privileged: ReadonlyArray<string> = PRIVILEGED_CAPABILITIES;
  return capabilities.some((c) => privileged.includes(c));
}

/**
 * An actor may assign a privileged role only if they themselves hold
 * roles.manage. A mere roles.assign / users.approve / allowlist.manage holder
 * can assign ordinary roles but cannot mint administrators.
 */
export function actorCanAssignRole(
  roleCapabilities: ReadonlyArray<Capability>,
  actorCaps: ReadonlyArray<string>
): boolean {
  return (
    !roleHasPrivilegedCaps(roleCapabilities) || actorCaps.includes("roles.manage")
  );
}
