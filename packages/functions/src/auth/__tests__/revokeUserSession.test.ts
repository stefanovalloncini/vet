import { describe, expect, it } from "vitest";
import { ensureCanRevoke, ensureNotSelf } from "../revokeUserSession.js";

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

describe("ensureNotSelf", () => {
  it("rejects revoking your own session", () => {
    expect(() => ensureNotSelf("same-uid", "same-uid")).toThrow();
  });

  it("allows revoking another user's session", () => {
    expect(() => ensureNotSelf("target-uid", "caller-uid")).not.toThrow();
  });
});
