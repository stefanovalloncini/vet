import { describe, expect, it } from "vitest";
import {
  TTL_DAYS,
  computeExpiresAtMillis,
  parseAccessRequest,
} from "../accessRequest.js";

const firstAttemptAt = new Date("2026-02-01T10:00:00.000Z");
const lastAttemptAt = new Date("2026-02-03T10:00:00.000Z");

const validDoc = {
  emailNorm: "vet@example.com",
  email: "vet@example.com",
  firstAttemptAt,
  lastAttemptAt,
  attempts: 3,
  schemaVersion: 1,
};

describe("parseAccessRequest", () => {
  it("parses a valid document, keeping the normalized id", () => {
    expect(parseAccessRequest("vet@example.com", validDoc)).toEqual({
      emailNorm: "vet@example.com",
      email: "vet@example.com",
      firstAttemptAt,
      lastAttemptAt,
      attempts: 3,
      schemaVersion: 1,
    });
  });

  it("includes optional displayName/photoURL/providerId when present", () => {
    const entity = parseAccessRequest("vet@example.com", {
      ...validDoc,
      displayName: "Vet One",
      photoURL: "https://example.com/a.png",
      providerId: "google.com",
    });
    expect(entity.displayName).toBe("Vet One");
    expect(entity.photoURL).toBe("https://example.com/a.png");
    expect(entity.providerId).toBe("google.com");
  });

  it("does not surface expiresAt on the entity even when stored", () => {
    const entity = parseAccessRequest("vet@example.com", {
      ...validDoc,
      expiresAt: new Date("2026-05-01T00:00:00.000Z"),
    });
    expect("expiresAt" in entity).toBe(false);
  });

  it("rejects an extra field via .strict()", () => {
    expect(() =>
      parseAccessRequest("vet@example.com", { ...validDoc, admin: true })
    ).toThrow();
  });

  it("rejects a missing required field", () => {
    const { attempts: _omit, ...without } = validDoc;
    void _omit;
    expect(() => parseAccessRequest("vet@example.com", without)).toThrow();
  });

  it("rejects a malformed email", () => {
    expect(() =>
      parseAccessRequest("x", { ...validDoc, email: "not-an-email" })
    ).toThrow();
  });

  it("rejects attempts outside the 1..10000 range", () => {
    expect(() =>
      parseAccessRequest("x", { ...validDoc, attempts: 0 })
    ).toThrow();
    expect(() =>
      parseAccessRequest("x", { ...validDoc, attempts: 10001 })
    ).toThrow();
  });

  it("rejects a non-URL photoURL", () => {
    expect(() =>
      parseAccessRequest("x", { ...validDoc, photoURL: "not a url" })
    ).toThrow();
  });
});

describe("computeExpiresAtMillis", () => {
  it("adds the TTL window to the given instant", () => {
    const now = Date.UTC(2026, 1, 1, 10, 0, 0);
    const msPerDay = 24 * 60 * 60 * 1000;
    expect(computeExpiresAtMillis(now)).toBe(now + TTL_DAYS * msPerDay);
  });

  it("uses a positive 90-day TTL", () => {
    expect(TTL_DAYS).toBe(90);
    expect(computeExpiresAtMillis(0)).toBeGreaterThan(0);
  });
});
