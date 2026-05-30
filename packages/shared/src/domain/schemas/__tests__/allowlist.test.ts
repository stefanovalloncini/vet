import { describe, expect, it } from "vitest";
import {
  allowlistEntryInputSchema,
  normalizeEmail,
} from "../allowlist.js";

describe("normalizeEmail", () => {
  it("trims surrounding whitespace and lowercases", () => {
    expect(normalizeEmail("  Mario.Rossi@VET.IT  ")).toBe("mario.rossi@vet.it");
  });

  it("is idempotent", () => {
    const once = normalizeEmail("\tFoo@Bar.Com\n");
    expect(normalizeEmail(once)).toBe(once);
    expect(once).toBe("foo@bar.com");
  });

  it("leaves an already-normalized address unchanged", () => {
    expect(normalizeEmail("vet@example.com")).toBe("vet@example.com");
  });
});

describe("allowlistEntryInputSchema", () => {
  const valid = {
    email: "mario.rossi@vet.it",
    defaultRoleId: "vet",
    notes: "collega",
  };

  it("accepts a valid entry (notes optional)", () => {
    expect(allowlistEntryInputSchema.safeParse(valid).success).toBe(true);
    const { notes, ...withoutNotes } = valid;
    void notes;
    expect(allowlistEntryInputSchema.safeParse(withoutNotes).success).toBe(true);
  });

  it("rejects unknown fields (strict)", () => {
    expect(
      allowlistEntryInputSchema.safeParse({ ...valid, role: "admin" }).success
    ).toBe(false);
  });

  it("rejects a formula-injection email prefix", () => {
    expect(
      allowlistEntryInputSchema.safeParse({ ...valid, email: "=cmd@x.it" })
        .success
    ).toBe(false);
  });

  it("requires a non-empty defaultRoleId and caps notes length", () => {
    expect(
      allowlistEntryInputSchema.safeParse({ ...valid, defaultRoleId: "" })
        .success
    ).toBe(false);
    expect(
      allowlistEntryInputSchema.safeParse({ ...valid, notes: "x".repeat(501) })
        .success
    ).toBe(false);
  });
});
