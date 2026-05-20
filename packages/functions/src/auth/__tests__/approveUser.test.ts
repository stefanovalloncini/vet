import { describe, it, expect } from "vitest";
import { buildApprovePatch } from "../approveUser.js";

describe("buildApprovePatch", () => {
  it("returns the patch shape the rules expect", () => {
    const now = new Date("2026-05-20T10:00:00Z");
    expect(buildApprovePatch({ actorUid: "admin", roleId: "vet", now })).toEqual({
      approved: true,
      roleId: "vet",
      approvedAt: now,
      approvedBy: "admin",
      updatedAt: now,
    });
  });

  it("uses the actor uid that approved, not a stamp", () => {
    const now = new Date();
    const patch = buildApprovePatch({ actorUid: "different-admin", roleId: "viewer", now });
    expect(patch.approvedBy).toBe("different-admin");
    expect(patch.roleId).toBe("viewer");
  });
});
