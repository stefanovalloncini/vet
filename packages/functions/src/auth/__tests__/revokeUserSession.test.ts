import { describe, expect, it } from "vitest";
import { ensureCanRevoke } from "../revokeUserSession.js";

describe("ensureCanRevoke", () => {
  it("allows admin caller with allowlist.manage", () => {
    expect(() =>
      ensureCanRevoke({
        uid: "admin-uid",
        caps: ["allowlist.manage"],
      })
    ).not.toThrow();
  });

  it("rejects caller without allowlist.manage", () => {
    expect(() =>
      ensureCanRevoke({
        uid: "user-uid",
        caps: ["activities.read.all"],
      })
    ).toThrow();
  });

  it("rejects unauthenticated caller", () => {
    expect(() => ensureCanRevoke(null)).toThrow();
  });
});
