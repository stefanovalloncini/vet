import { describe, expect, it } from "vitest";
import { composeClaims } from "../beforeSignIn";
import { CAPABILITIES } from "@vet/shared";

describe("composeClaims", () => {
  it("encodes capabilities as short codes", () => {
    const claims = composeClaims({
      roleId: "vet",
      capabilities: ["activities.read.all", "activities.create"],
      capsVer: 12345,
    });
    expect(claims).toEqual({
      vet: true,
      roleId: "vet",
      caps: ["ara", "ac"],
      capsVer: 12345,
    });
  });

  it("encoded full-admin payload stays under 1000 bytes", () => {
    const claims = {
      ...composeClaims({
        roleId: "admin",
        capabilities: [...CAPABILITIES],
        capsVer: 1234567890123,
      }),
      name: "Stefano Valloncini",
    };
    const size = new TextEncoder().encode(JSON.stringify(claims)).length;
    expect(size).toBeLessThan(1000);
  });
});
