import { describe, it, expect } from "vitest";
import { decideAuthResult } from "../beforeSignIn.js";

const allow = { defaultRoleId: "vet" };
const role = { capabilities: ["activities.read.all"] as const };

describe("decideAuthResult", () => {
  it("first sign-in: no claims, isFirst=true", () => {
    const out = decideAuthResult({
      allow,
      existing: null,
      role,
      displayName: "A",
    });
    expect(out.customClaims).toBeUndefined();
    expect(out.isFirst).toBe(true);
  });

  it("returning pending user: still no claims, isFirst=false", () => {
    const out = decideAuthResult({
      allow,
      existing: { approved: false, roleId: "vet", displayName: "A" },
      role,
      displayName: "A",
    });
    expect(out.customClaims).toBeUndefined();
    expect(out.isFirst).toBe(false);
  });

  it("approved user: claims with caps issued", () => {
    const out = decideAuthResult({
      allow,
      existing: { approved: true, roleId: "vet", displayName: "A" },
      role,
      displayName: "A",
    });
    expect(out.customClaims).toMatchObject({ vet: true, roleId: "vet" });
    expect(out.isFirst).toBe(false);
  });

  it("approved user: capsVer in claims comes from role.capsVer", () => {
    const out = decideAuthResult({
      allow,
      existing: { approved: true, roleId: "vet", displayName: "A" },
      role: { capabilities: ["activities.read.all"], capsVer: 42 },
      displayName: "A",
    });
    expect(out.customClaims).toMatchObject({ capsVer: 42 });
  });

  it("approved user: capsVer defaults to 0 when role doc has none", () => {
    const out = decideAuthResult({
      allow,
      existing: { approved: true, roleId: "vet", displayName: "A" },
      role,
      displayName: "A",
    });
    expect(out.customClaims).toMatchObject({ capsVer: 0 });
  });
});
