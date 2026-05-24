import { describe, it, expect } from "vitest";
import { HttpsError } from "firebase-functions/v2/https";
import { ensureCanManageAllowlist } from "../deleteAllowlistEntry.js";

describe("deleteAllowlistEntry.ensureCanManageAllowlist", () => {
  it("throws unauthenticated when caller is null", () => {
    expect(() => ensureCanManageAllowlist(null)).toThrowError(HttpsError);
  });

  it("throws permission-denied when caller lacks allowlist.manage", () => {
    expect(() =>
      ensureCanManageAllowlist({ uid: "u", email: "u@x.com", caps: ["audit.read"] })
    ).toThrowError(HttpsError);
  });

  it("returns without throwing when caller has allowlist.manage", () => {
    expect(() =>
      ensureCanManageAllowlist({
        uid: "u",
        email: "u@x.com",
        caps: ["allowlist.manage"],
      })
    ).not.toThrow();
  });
});
