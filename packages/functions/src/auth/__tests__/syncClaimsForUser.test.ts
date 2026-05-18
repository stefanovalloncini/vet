import { describe, expect, it } from "vitest";
import { computeClaimsForUser } from "../onRoleChange.js";

describe("computeClaimsForUser", () => {
  it("returns claims with the role's current capabilities", () => {
    const claims = computeClaimsForUser({
      roleId: "vet",
      capabilities: ["activities.read.all"],
      capsVer: 999,
    });
    expect(claims).toEqual({
      vet: true,
      roleId: "vet",
      caps: ["activities.read.all"],
      capsVer: 999,
    });
  });
});
