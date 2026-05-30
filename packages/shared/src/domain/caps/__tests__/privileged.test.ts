import { describe, it, expect } from "vitest";
import {
  PRIVILEGED_CAPABILITIES,
  roleHasPrivilegedCaps,
  actorCanAssignRole,
} from "../privileged.js";
import {
  VETERINARIO_CAPS,
  TITOLARE_CAPS,
  AMMINISTRATORE_CAPS,
} from "../bundles.js";

describe("roleHasPrivilegedCaps", () => {
  it("is false for the veterinario bundle", () => {
    expect(roleHasPrivilegedCaps(VETERINARIO_CAPS)).toBe(false);
  });

  it("is false for the titolare bundle (conti.emit/saldo are not privileged)", () => {
    expect(roleHasPrivilegedCaps(TITOLARE_CAPS)).toBe(false);
  });

  it("is true for the amministratore bundle", () => {
    expect(roleHasPrivilegedCaps(AMMINISTRATORE_CAPS)).toBe(true);
  });

  it("is true if the role carries any single privileged cap", () => {
    for (const cap of PRIVILEGED_CAPABILITIES) {
      expect(roleHasPrivilegedCaps([cap])).toBe(true);
    }
  });

  it("treats roles.manage/roles.assign/allowlist.manage/users.approve as the privileged set", () => {
    expect([...PRIVILEGED_CAPABILITIES].sort()).toEqual(
      ["allowlist.manage", "roles.assign", "roles.manage", "users.approve"].sort()
    );
  });
});

describe("actorCanAssignRole", () => {
  it("lets a roles.assign holder assign a non-privileged role", () => {
    expect(actorCanAssignRole(VETERINARIO_CAPS, ["roles.assign"])).toBe(true);
  });

  it("denies a roles.assign-only holder assigning a privileged role", () => {
    expect(actorCanAssignRole(AMMINISTRATORE_CAPS, ["roles.assign"])).toBe(false);
  });

  it("denies a users.approve-only holder assigning a privileged role", () => {
    expect(actorCanAssignRole(AMMINISTRATORE_CAPS, ["users.approve"])).toBe(false);
  });

  it("lets a roles.manage holder assign a privileged role", () => {
    expect(
      actorCanAssignRole(AMMINISTRATORE_CAPS, ["roles.assign", "roles.manage"])
    ).toBe(true);
  });
});
