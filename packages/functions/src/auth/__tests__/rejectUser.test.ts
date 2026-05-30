import { describe, it, expect } from "vitest";
import { HttpsError } from "firebase-functions/v2/https";
import { ensureCanRejectUser } from "../rejectUser.js";

describe("rejectUser.ensureCanRejectUser", () => {
  it("throws permission-denied when the caller uid is missing", () => {
    expect(() =>
      ensureCanRejectUser({ uid: undefined, caps: ["users.approve"] })
    ).toThrowError(HttpsError);
  });

  it("returns the caller uid when authorized", () => {
    expect(
      ensureCanRejectUser({ uid: "admin", caps: ["users.approve"] })
    ).toBe("admin");
  });

  it("throws permission-denied when the caller lacks users.approve", () => {
    expect(() =>
      ensureCanRejectUser({ uid: "admin", caps: ["audit.read"] })
    ).toThrowError(HttpsError);
  });

  it("passes when the caller has a uid and users.approve", () => {
    expect(() =>
      ensureCanRejectUser({ uid: "admin", caps: ["users.approve"] })
    ).not.toThrow();
  });
});
