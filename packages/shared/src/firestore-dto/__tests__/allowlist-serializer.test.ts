import { describe, expect, it } from "vitest";
import {
  buildAllowlistEntryAddDoc,
  parseAllowlistEntry,
} from "../allowlist.js";
import type { AllowlistEntryInput } from "../../domain/schemas/allowlist.js";

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

const SERVER_TS = "SERVER_TS" as const;
const deps = {
  fromDate: (d: Date) => d,
  serverTimestamp: () => SERVER_TS,
};

const baseInput: AllowlistEntryInput = {
  email: "vet@example.com",
  defaultRoleId: "role-vet",
};

describe("buildAllowlistEntryAddDoc", () => {
  it("maps input + actor into an add payload with a server stamp", () => {
    const payload = buildAllowlistEntryAddDoc(
      { input: baseInput, actor: "uid-admin" },
      deps
    );
    expect(payload).toEqual({
      email: "vet@example.com",
      defaultRoleId: "role-vet",
      invitedBy: "uid-admin",
      invitedAt: SERVER_TS,
      schemaVersion: 1,
    });
  });

  it("includes notes when present and omits them when absent", () => {
    expect(
      buildAllowlistEntryAddDoc(
        { input: { ...baseInput, notes: "titolare" }, actor: "a" },
        deps
      ).notes
    ).toBe("titolare");
    expect(
      "notes" in
        buildAllowlistEntryAddDoc({ input: baseInput, actor: "a" }, deps)
    ).toBe(false);
  });

  it("uses deps.serverTimestamp for invitedAt, not a client clock", () => {
    const payload = buildAllowlistEntryAddDoc(
      { input: baseInput, actor: "a" },
      deps
    );
    expect(payload.invitedAt).toBe(SERVER_TS);
  });

  it("round-trips through parseAllowlistEntry with a real Date stamp", () => {
    const payload = buildAllowlistEntryAddDoc(
      { input: { ...baseInput, notes: "titolare" }, actor: "uid-admin" },
      { fromDate: (d: Date) => d, serverTimestamp: () => invitedAt }
    );
    expect(parseAllowlistEntry("vet@example.com", payload)).toEqual({
      emailNorm: "vet@example.com",
      email: "vet@example.com",
      defaultRoleId: "role-vet",
      invitedBy: "uid-admin",
      invitedAt,
      notes: "titolare",
      schemaVersion: 1,
    });
  });
});
