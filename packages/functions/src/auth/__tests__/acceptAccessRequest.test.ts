import { describe, it, expect } from "vitest";
import { Timestamp } from "firebase-admin/firestore";
import { buildAllowlistEntry } from "../acceptAccessRequest.js";

const now = Timestamp.fromDate(new Date("2026-05-21T10:00:00Z"));

describe("buildAllowlistEntry", () => {
  it("returns the allowlist row shape with the actor as inviter", () => {
    expect(
      buildAllowlistEntry({
        email: "pippo@example.com",
        roleId: "vet",
        actorUid: "admin-uid",
        now,
      })
    ).toEqual({
      email: "pippo@example.com",
      defaultRoleId: "vet",
      invitedBy: "admin-uid",
      invitedAt: now,
      schemaVersion: 1,
    });
  });

  it("uses the chosen roleId, not a default", () => {
    const out = buildAllowlistEntry({
      email: "a@b.com",
      roleId: "viewer",
      actorUid: "x",
      now,
    });
    expect(out.defaultRoleId).toBe("viewer");
  });
});
