import { describe, expect, it } from "vitest";
import { safeEmail, safeName, SAFE_EMAIL_REGEX } from "../safeString.js";

describe("SAFE_EMAIL_REGEX", () => {
  it("accepts ordinary emails", () => {
    expect(SAFE_EMAIL_REGEX.test("stefano@example.com")).toBe(true);
  });

  it("rejects formula-injection prefixes", () => {
    for (const bad of ["=foo@bar.it", "+foo@bar.it", "-foo@bar.it", "@foo@bar.it"]) {
      expect(SAFE_EMAIL_REGEX.test(bad)).toBe(false);
    }
  });
});

describe("safeEmail()", () => {
  it("accepts a valid email at default cap", () => {
    expect(safeEmail().safeParse("vet@example.com").success).toBe(true);
  });

  it("rejects empty string", () => {
    expect(safeEmail().safeParse("").success).toBe(false);
  });

  it("rejects an email longer than the cap", () => {
    expect(safeEmail(20).safeParse("a".repeat(16) + "@b.it").success).toBe(false);
  });

  it("rejects formula-injection prefixes", () => {
    for (const bad of ["=cmd@x.it", "+x@y.it", "-x@y.it", "@x@y.it"]) {
      expect(safeEmail().safeParse(bad).success).toBe(false);
    }
  });
});

describe("safeName()", () => {
  it("accepts a normal display name", () => {
    expect(safeName(80).safeParse("Stefano Valloncini").success).toBe(true);
  });

  it("rejects empty string", () => {
    expect(safeName(80).safeParse("").success).toBe(false);
  });

  it("rejects strings longer than the cap", () => {
    expect(safeName(10).safeParse("x".repeat(11)).success).toBe(false);
  });

  it("rejects names starting with =+-@", () => {
    for (const bad of ["=cmd", "+cmd", "-cmd", "@cmd"]) {
      expect(safeName(80).safeParse(bad).success).toBe(false);
    }
  });
});
