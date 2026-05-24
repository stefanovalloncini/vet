import { describe, it, expect } from "vitest";
import { decideAuthResult } from "../beforeSignIn.js";

const allow = { defaultRoleId: "vet" };
const role = { capabilities: ["activities.read.all"] as const };

describe("decideAuthResult", () => {
  it("first sign-in: creates pending user, no claims, no role assigned beyond default", () => {
    const out = decideAuthResult({
      allow,
      existing: null,
      role,
      email: "a@b.com",
      displayName: "A",
      now: new Date("2026-05-20T10:00:00Z"),
    });
    expect(out.customClaims).toBeUndefined();
    expect(out.userPatch).toMatchObject({
      approved: false,
      roleId: "vet",
      email: "a@b.com",
    });
    expect(out.isFirst).toBe(true);
  });

  it("returning pending user: still no claims", () => {
    const out = decideAuthResult({
      allow,
      existing: { approved: false, roleId: "vet", displayName: "A" },
      role,
      email: "a@b.com",
      displayName: "A",
      now: new Date(),
    });
    expect(out.customClaims).toBeUndefined();
    expect(out.isFirst).toBe(false);
  });

  it("approved user: claims with caps issued", () => {
    const out = decideAuthResult({
      allow,
      existing: { approved: true, roleId: "vet", displayName: "A" },
      role,
      email: "a@b.com",
      displayName: "A",
      now: new Date(),
    });
    expect(out.customClaims).toMatchObject({ vet: true, roleId: "vet" });
  });

  it("first-sign-in user patch does not include approved/roleId for returning users", () => {
    const out = decideAuthResult({
      allow,
      existing: { approved: true, roleId: "vet", displayName: "A" },
      role,
      email: "a@b.com",
      displayName: "A",
      now: new Date(),
    });
    expect(out.userPatch).not.toHaveProperty("approved");
    expect(out.userPatch).not.toHaveProperty("createdAt");
  });

  it("approved user: capsVer in claims comes from role.capsVer", () => {
    const out = decideAuthResult({
      allow,
      existing: { approved: true, roleId: "vet", displayName: "A" },
      role: { capabilities: ["activities.read.all"], capsVer: 42 },
      email: "a@b.com",
      displayName: "A",
      now: new Date(),
    });
    expect(out.customClaims).toMatchObject({ capsVer: 42 });
  });

  it("approved user: capsVer defaults to 0 when role doc has none", () => {
    const out = decideAuthResult({
      allow,
      existing: { approved: true, roleId: "vet", displayName: "A" },
      role,
      email: "a@b.com",
      displayName: "A",
      now: new Date(),
    });
    expect(out.customClaims).toMatchObject({ capsVer: 0 });
  });
});
