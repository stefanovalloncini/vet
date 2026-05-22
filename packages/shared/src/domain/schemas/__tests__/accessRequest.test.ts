import { describe, it, expect } from "vitest";
import {
  accessRequestDocSchema,
  acceptAccessRequestInputSchema,
  rejectAccessRequestInputSchema,
} from "../accessRequest";

describe("accessRequestDocSchema", () => {
  const base = {
    emailNorm: "user@example.com",
    email: "User@Example.com",
    firstAttemptAt: new Date("2026-05-21T10:00:00Z"),
    lastAttemptAt: new Date("2026-05-21T10:00:00Z"),
    attempts: 1,
    schemaVersion: 1 as const,
  };

  it("accepts a minimal payload", () => {
    expect(accessRequestDocSchema.parse(base)).toEqual(base);
  });

  it("accepts displayName, photoURL, providerId", () => {
    const parsed = accessRequestDocSchema.parse({
      ...base,
      displayName: "User",
      photoURL: "https://example.com/avatar.png",
      providerId: "google.com",
    });
    expect(parsed.displayName).toBe("User");
    expect(parsed.photoURL).toBe("https://example.com/avatar.png");
    expect(parsed.providerId).toBe("google.com");
  });

  it("rejects extra fields", () => {
    expect(() => accessRequestDocSchema.parse({ ...base, extra: "x" })).toThrow();
  });

  it("rejects attempts < 1", () => {
    expect(() => accessRequestDocSchema.parse({ ...base, attempts: 0 })).toThrow();
  });

  it("rejects attempts > 10000", () => {
    expect(() =>
      accessRequestDocSchema.parse({ ...base, attempts: 10001 })
    ).toThrow();
  });

  it("rejects email > 120 chars", () => {
    const long = `${"a".repeat(120)}@example.com`;
    expect(() => accessRequestDocSchema.parse({ ...base, email: long })).toThrow();
  });

  it("rejects displayName > 120 chars", () => {
    expect(() =>
      accessRequestDocSchema.parse({ ...base, displayName: "x".repeat(121) })
    ).toThrow();
  });

  it("rejects photoURL > 500 chars", () => {
    const url = `https://example.com/${"a".repeat(490)}`;
    expect(() =>
      accessRequestDocSchema.parse({ ...base, photoURL: url })
    ).toThrow();
  });

  it("rejects schemaVersion != 1", () => {
    expect(() =>
      accessRequestDocSchema.parse({ ...base, schemaVersion: 2 })
    ).toThrow();
  });
});

describe("acceptAccessRequestInputSchema", () => {
  it("accepts valid input", () => {
    const input = { email: "a@b.com", roleId: "vet" };
    expect(acceptAccessRequestInputSchema.parse(input)).toEqual(input);
  });

  it("rejects empty roleId", () => {
    expect(() =>
      acceptAccessRequestInputSchema.parse({ email: "a@b.com", roleId: "" })
    ).toThrow();
  });

  it("rejects extra fields", () => {
    expect(() =>
      acceptAccessRequestInputSchema.parse({
        email: "a@b.com",
        roleId: "vet",
        extra: "x",
      })
    ).toThrow();
  });
});

describe("rejectAccessRequestInputSchema", () => {
  it("accepts valid email", () => {
    expect(rejectAccessRequestInputSchema.parse({ email: "a@b.com" })).toEqual({
      email: "a@b.com",
    });
  });

  it("rejects bad email", () => {
    expect(() => rejectAccessRequestInputSchema.parse({ email: "x" })).toThrow();
  });
});
