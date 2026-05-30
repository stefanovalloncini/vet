import { describe, expect, it } from "vitest";
import {
  computeClaimsForUser,
  isCapsVerBumpWrite,
} from "../onRoleChange.js";

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

describe("isCapsVerBumpWrite", () => {
  it("flags the trigger's own capsVer bump so it does not re-propagate", () => {
    expect(
      isCapsVerBumpWrite({ beforeCapsVer: 4, afterCapsVer: 5 })
    ).toBe(true);
  });

  it("flags the first bump from no prior capsVer", () => {
    expect(
      isCapsVerBumpWrite({ beforeCapsVer: undefined, afterCapsVer: 1 })
    ).toBe(true);
  });

  it("does not flag an admin capability edit that leaves capsVer absent", () => {
    expect(
      isCapsVerBumpWrite({ beforeCapsVer: 4, afterCapsVer: undefined })
    ).toBe(false);
  });

  it("does not flag a write that leaves capsVer unchanged", () => {
    expect(
      isCapsVerBumpWrite({ beforeCapsVer: 7, afterCapsVer: 7 })
    ).toBe(false);
  });
});
