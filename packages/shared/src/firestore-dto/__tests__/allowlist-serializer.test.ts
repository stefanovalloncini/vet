import { describe, expect, it } from "vitest";
import { parseAllowlistEntry } from "../allowlist.js";

const invitedAt = new Date("2026-02-10T09:30:00.000Z");

const validDoc = {
  email: "vet@example.com",
  defaultRoleId: "role-vet",
  invitedBy: "uid-admin",
  invitedAt,
  schemaVersion: 1,
};

describe("parseAllowlistEntry", () => {
  it("parses a valid allowlist document, keeping the normalized id", () => {
    const entry = parseAllowlistEntry("vet@example.com", validDoc);
    expect(entry).toEqual({
      emailNorm: "vet@example.com",
      email: "vet@example.com",
      defaultRoleId: "role-vet",
      invitedBy: "uid-admin",
      invitedAt,
      schemaVersion: 1,
    });
  });

  it("includes notes when present and omits them when absent", () => {
    expect(
      parseAllowlistEntry("vet@example.com", { ...validDoc, notes: "titolare" })
        .notes
    ).toBe("titolare");
    expect("notes" in parseAllowlistEntry("vet@example.com", validDoc)).toBe(
      false
    );
  });

  it("rejects an extra field via .strict()", () => {
    expect(() =>
      parseAllowlistEntry("vet@example.com", { ...validDoc, role: "admin" })
    ).toThrow();
  });

  it("rejects a missing required field", () => {
    const { defaultRoleId: _omit, ...without } = validDoc;
    void _omit;
    expect(() => parseAllowlistEntry("vet@example.com", without)).toThrow();
  });

  it("rejects a malformed email", () => {
    expect(() =>
      parseAllowlistEntry("x", { ...validDoc, email: "not-an-email" })
    ).toThrow();
  });

  it("rejects an oversize email", () => {
    const huge = `${"a".repeat(120)}@example.com`;
    expect(() =>
      parseAllowlistEntry("x", { ...validDoc, email: huge })
    ).toThrow();
  });

  it("rejects oversize notes beyond the cap", () => {
    expect(() =>
      parseAllowlistEntry("vet@example.com", {
        ...validDoc,
        notes: "n".repeat(501),
      })
    ).toThrow();
  });
});
