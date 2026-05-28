import { describe, expect, it } from "vitest";
import {
  buildUserApprovePatch,
  buildUserRevokeSessionPatch,
  buildUserSignInPatch,
  parseUser,
  userDtoSchema,
} from "../user.js";
import type { SerializerStampDeps } from "../_shared.js";

class ServerStamp {
  constructor(readonly at: Date) {}
  toDate() {
    return this.at;
  }
}

const now = new Date("2026-04-15T08:30:00.000Z");
const deps: Pick<SerializerStampDeps<unknown, ServerStamp>, "serverTimestamp"> = {
  serverTimestamp: () => new ServerStamp(now),
};

describe("buildUserSignInPatch", () => {
  it("creates a first-time user as not approved (deny by default)", () => {
    const patch = buildUserSignInPatch(
      {
        email: "new@example.it",
        displayName: "Nuovo",
        isFirst: true,
        defaultRoleId: "veterinario_semplice",
      },
      deps
    );
    expect(patch.approved).toBe(false);
    expect(patch.roleId).toBe("veterinario_semplice");
    expect(patch.createdAt).toBeInstanceOf(ServerStamp);
    expect(patch.disabled).toBe(false);
  });

  it("does not reset approval or role on a returning sign-in", () => {
    const patch = buildUserSignInPatch(
      {
        email: "back@example.it",
        displayName: "Ritorno",
        isFirst: false,
        defaultRoleId: "veterinario_semplice",
      },
      deps
    );
    expect("approved" in patch).toBe(false);
    expect("roleId" in patch).toBe(false);
    expect("createdAt" in patch).toBe(false);
    expect(patch.lastSignInAt).toBeInstanceOf(ServerStamp);
  });
});

describe("buildUserApprovePatch", () => {
  it("flips approved and records the approver", () => {
    const patch = buildUserApprovePatch(
      { actorUid: "admin-1", roleId: "veterinario_capo" },
      deps
    );
    expect(patch.approved).toBe(true);
    expect(patch.roleId).toBe("veterinario_capo");
    expect(patch.approvedBy).toBe("admin-1");
    expect(patch.approvedAt).toBeInstanceOf(ServerStamp);
  });
});

describe("buildUserRevokeSessionPatch", () => {
  it("bumps minCapsVer to invalidate stale tokens", () => {
    const patch = buildUserRevokeSessionPatch({ minCapsVer: 5 }, deps);
    expect(patch.minCapsVer).toBe(5);
    expect(patch.updatedAt).toBeInstanceOf(ServerStamp);
    expect("disabled" in patch).toBe(false);
    expect("approved" in patch).toBe(false);
  });

  it("can disable and unapprove in the same revoke", () => {
    const patch = buildUserRevokeSessionPatch(
      { minCapsVer: 6, disabled: true, approved: false },
      deps
    );
    expect(patch.disabled).toBe(true);
    expect(patch.approved).toBe(false);
  });
});

describe("parseUser", () => {
  const validDoc = {
    email: "vet@example.it",
    displayName: "Vet One",
    roleId: "veterinario_semplice",
    approved: true,
    disabled: false,
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1 as const,
  };

  it("parses a valid user document", () => {
    const user = parseUser("uid-1", validDoc);
    expect(user.uid).toBe("uid-1");
    expect(user.approved).toBe(true);
    expect(user.createdAt.getTime()).toBe(now.getTime());
  });

  it("rejects an unrecognized extra key via .strict()", () => {
    expect(userDtoSchema.safeParse({ ...validDoc, isAdmin: true }).success).toBe(
      false
    );
  });

  it("rejects a displayName beyond the length cap", () => {
    expect(() =>
      parseUser("x", { ...validDoc, displayName: "n".repeat(81) })
    ).toThrow();
  });

  it("rejects a missing required field", () => {
    const { approved: _omit, ...without } = validDoc;
    void _omit;
    expect(() => parseUser("x", without)).toThrow();
  });

  it("carries optional approval audit fields when present", () => {
    const user = parseUser("uid-2", {
      ...validDoc,
      approvedAt: now,
      approvedBy: "admin-1",
      minCapsVer: 3,
    });
    expect(user.approvedBy).toBe("admin-1");
    expect(user.minCapsVer).toBe(3);
    expect(user.approvedAt?.getTime()).toBe(now.getTime());
  });
});
