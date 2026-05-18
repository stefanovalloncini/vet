import { describe, expect, it } from "vitest";
import { composeClaims } from "../beforeSignIn";

describe("composeClaims", () => {
  it("composes claims from a role document", () => {
    const claims = composeClaims({
      roleId: "vet",
      capabilities: ["activities.read.all", "activities.create"],
      capsVer: 12345,
    });
    expect(claims).toEqual({
      vet: true,
      roleId: "vet",
      caps: ["activities.read.all", "activities.create"],
      capsVer: 12345,
    });
  });
});
