import { describe, expect, it } from "vitest";
import { HttpsError } from "firebase-functions/v2/https";
import { ensureRecentAuth } from "../recentAuth.js";

function withAuth(authTime: number | undefined): Parameters<typeof ensureRecentAuth>[0] {
  return {
    auth: {
      uid: "u",
      token: authTime !== undefined ? { auth_time: authTime } : {},
    } as never,
  };
}

const NOW = 2_000_000;

describe("ensureRecentAuth", () => {
  it("passes when auth_time is within the max-age window", () => {
    expect(() =>
      ensureRecentAuth(withAuth(NOW - 60), { maxAgeSeconds: 300, nowSeconds: NOW })
    ).not.toThrow();
  });

  it("passes at the exact boundary", () => {
    expect(() =>
      ensureRecentAuth(withAuth(NOW - 300), { maxAgeSeconds: 300, nowSeconds: NOW })
    ).not.toThrow();
  });

  it("throws when auth_time is older than max-age", () => {
    try {
      ensureRecentAuth(withAuth(NOW - 600), { maxAgeSeconds: 300, nowSeconds: NOW });
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(HttpsError);
      expect((err as HttpsError).code).toBe("failed-precondition");
      expect((err as HttpsError).message).toBe("requires-recent-login");
    }
  });

  it("throws when auth_time claim is missing", () => {
    expect(() => ensureRecentAuth(withAuth(undefined))).toThrow(HttpsError);
  });

  it("throws when auth context is missing", () => {
    expect(() =>
      ensureRecentAuth({ auth: undefined } as never)
    ).toThrow(HttpsError);
  });
});
