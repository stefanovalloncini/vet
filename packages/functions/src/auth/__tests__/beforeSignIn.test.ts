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

  it("approved user: capsVer in claims comes from the user's minCapsVer floor", () => {
    const out = decideAuthResult({
      allow,
      existing: {
        approved: true,
        roleId: "vet",
        displayName: "A",
        minCapsVer: 1748600000000,
      },
      role,
      displayName: "A",
    });
    expect(out.customClaims).toMatchObject({ capsVer: 1748600000000 });
  });

  it("approved user: capsVer defaults to 0 when the user has no minCapsVer", () => {
    const out = decideAuthResult({
      allow,
      existing: { approved: true, roleId: "vet", displayName: "A" },
      role,
      displayName: "A",
    });
    expect(out.customClaims).toMatchObject({ capsVer: 0 });
  });

  it("re-sign-in invariant: minted capsVer satisfies the persisted minCapsVer floor", () => {
    // approveUser/selfRevoke/revokeUserSession/onRoleChange all write minCapsVer
    // as a wall-clock millis value; the token minted on the next sign-in must
    // clear that floor or firestore.rules tokenIsFresh() bricks the user.
    const persistedFloor = 1748600000000;
    const out = decideAuthResult({
      allow,
      existing: {
        approved: true,
        roleId: "vet",
        displayName: "A",
        minCapsVer: persistedFloor,
      },
      role,
      displayName: "A",
    });
    const minted = (out.customClaims as { capsVer: number }).capsVer;
    expect(minted).toBeGreaterThanOrEqual(persistedFloor);
  });
});
