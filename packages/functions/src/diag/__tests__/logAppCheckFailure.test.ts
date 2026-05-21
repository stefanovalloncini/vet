import { describe, it, expect, beforeEach } from "vitest";
import {
  appCheckFailureInputSchema,
  buildLogPayload,
  extractClientIp,
  shouldRateLimit,
  __resetRateLimitForTests,
} from "../logAppCheckFailure.js";

describe("appCheckFailureInputSchema", () => {
  it("accepts a minimal payload", () => {
    const r = appCheckFailureInputSchema.safeParse({
      stage: "getToken",
      reason: "network-error",
    });
    expect(r.success).toBe(true);
  });

  it("rejects extra fields", () => {
    const r = appCheckFailureInputSchema.safeParse({
      stage: "x",
      reason: "y",
      evil: 1,
    });
    expect(r.success).toBe(false);
  });

  it("rejects oversize strings", () => {
    const r = appCheckFailureInputSchema.safeParse({
      stage: "x".repeat(200),
      reason: "y",
    });
    expect(r.success).toBe(false);
  });
});

describe("shouldRateLimit", () => {
  beforeEach(() => __resetRateLimitForTests());

  it("allows the first 10 calls from a single IP within 60s", () => {
    const now = Date.now();
    for (let i = 0; i < 10; i++) {
      expect(shouldRateLimit("1.2.3.4", now)).toBe(false);
    }
  });

  it("blocks the 11th call within 60s", () => {
    const now = Date.now();
    for (let i = 0; i < 10; i++) shouldRateLimit("1.2.3.4", now);
    expect(shouldRateLimit("1.2.3.4", now + 1000)).toBe(true);
  });

  it("forgets after 60s", () => {
    const now = Date.now();
    for (let i = 0; i < 10; i++) shouldRateLimit("1.2.3.4", now);
    expect(shouldRateLimit("1.2.3.4", now + 61_000)).toBe(false);
  });

  it("tracks per-IP independently", () => {
    const now = Date.now();
    for (let i = 0; i < 10; i++) shouldRateLimit("1.2.3.4", now);
    expect(shouldRateLimit("5.6.7.8", now)).toBe(false);
  });
});

describe("buildLogPayload", () => {
  it("structures the log entry", () => {
    const p = buildLogPayload(
      { stage: "getToken", reason: "rejected", userAgent: "Mozilla/5.0" },
      "1.2.3.4"
    );
    expect(p).toEqual({
      stage: "getToken",
      reason: "rejected",
      userAgent: "Mozilla/5.0",
      ip: "1.2.3.4",
      screenWidth: undefined,
      screenHeight: undefined,
      projectStage: undefined,
    });
  });
});

describe("extractClientIp", () => {
  it("returns 'unknown' when no header is present", () => {
    expect(extractClientIp({})).toBe("unknown");
  });

  it("reads the first hop from a comma-separated X-Forwarded-For header", () => {
    expect(extractClientIp({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" })).toBe(
      "1.2.3.4"
    );
  });

  it("falls back to X-Real-IP when X-Forwarded-For is absent", () => {
    expect(extractClientIp({ "x-real-ip": "9.9.9.9" })).toBe("9.9.9.9");
  });

  it("handles array form of X-Forwarded-For", () => {
    expect(extractClientIp({ "x-forwarded-for": ["7.7.7.7, 10.0.0.1"] })).toBe(
      "7.7.7.7"
    );
  });

  it("trims surrounding whitespace from the first hop", () => {
    expect(extractClientIp({ "x-forwarded-for": "  6.6.6.6  , 10.0.0.1" })).toBe(
      "6.6.6.6"
    );
  });
});
