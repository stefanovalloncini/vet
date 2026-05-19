import { describe, expect, it } from "vitest";
import { computeClaimsForUser } from "../onRoleChange.js";

describe("computeClaimsForUser", () => {
  it("encodes caps as short codes", () => {
    const claims = computeClaimsForUser({
      roleId: "vet",
      capabilities: ["activities.read.all"],
      capsVer: 999,
    });
    expect(claims).toEqual({
      vet: true,
      roleId: "vet",
      caps: ["ara"],
      capsVer: 999,
    });
  });
});
