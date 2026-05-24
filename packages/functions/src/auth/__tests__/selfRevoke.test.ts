import { describe, it, expect } from "vitest";
import { HttpsError } from "firebase-functions/v2/https";
import { ensureCallerSignedIn } from "../selfRevoke.js";

describe("selfRevoke.ensureCallerSignedIn", () => {
  it("throws unauthenticated when caller is null", () => {
    expect(() => ensureCallerSignedIn(null)).toThrowError(HttpsError);
  });

  it("returns without throwing when caller is present", () => {
    expect(() =>
      ensureCallerSignedIn({ uid: "u1", email: "u1@example.com" })
    ).not.toThrow();
  });
});
