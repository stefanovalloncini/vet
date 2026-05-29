import { describe, expect, it } from "vitest";
import { parseAuditEvent } from "../audit.js";

const at = new Date("2026-04-01T12:00:00.000Z");

const validDoc = {
  at,
  actorUid: "uid-admin",
  actorEmail: "admin@example.com",
  action: "user.approve",
  targetType: "user",
  targetId: "uid-target",
};

describe("parseAuditEvent", () => {
  it("parses a valid audit document into the entity", () => {
    expect(parseAuditEvent("evt-1", validDoc)).toEqual({
      id: "evt-1",
      at,
      actorUid: "uid-admin",
      actorEmail: "admin@example.com",
      action: "user.approve",
      targetType: "user",
      targetId: "uid-target",
    });
  });

  it("includes details when present and omits them when absent", () => {
    expect(
      parseAuditEvent("evt-1", { ...validDoc, details: { roleId: "r1" } })
        .details
    ).toEqual({ roleId: "r1" });
    expect("details" in parseAuditEvent("evt-1", validDoc)).toBe(false);
  });

  it("accepts an empty actorEmail (system/anonymized events)", () => {
    expect(parseAuditEvent("evt-1", { ...validDoc, actorEmail: "" }).actorEmail).toBe(
      ""
    );
  });

  it("rejects an extra field via .strict()", () => {
    expect(() => parseAuditEvent("evt-1", { ...validDoc, ip: "1.2.3.4" })).toThrow();
  });

  it("rejects an unknown action", () => {
    expect(() =>
      parseAuditEvent("evt-1", { ...validDoc, action: "user.delete.everything" })
    ).toThrow();
  });

  it("rejects an unknown targetType", () => {
    expect(() =>
      parseAuditEvent("evt-1", { ...validDoc, targetType: "spaceship" })
    ).toThrow();
  });

  it("rejects a missing required field", () => {
    const { actorUid: _omit, ...without } = validDoc;
    void _omit;
    expect(() => parseAuditEvent("evt-1", without)).toThrow();
  });

  it("rejects an oversize targetId", () => {
    expect(() =>
      parseAuditEvent("evt-1", { ...validDoc, targetId: "t".repeat(201) })
    ).toThrow();
  });
});
