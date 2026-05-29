import { describe, expect, it } from "vitest";
import { parseRole } from "../role.js";

const createdAt = new Date("2026-01-01T08:00:00.000Z");
const updatedAt = new Date("2026-01-02T08:00:00.000Z");

const validRoleDoc = {
  name: "Veterinario capo",
  capabilities: ["aziende.read", "conti.emit", "conti.saldo"],
  locked: false,
  createdAt,
  updatedAt,
  createdBy: "uid-admin",
  updatedBy: "uid-admin",
  schemaVersion: 1,
};

describe("parseRole", () => {
  it("parses a valid role document into the entity", () => {
    const role = parseRole("role-1", validRoleDoc);
    expect(role).toEqual({
      id: "role-1",
      name: "Veterinario capo",
      capabilities: ["aziende.read", "conti.emit", "conti.saldo"],
      locked: false,
      createdAt,
      updatedAt,
      createdBy: "uid-admin",
      updatedBy: "uid-admin",
      schemaVersion: 1,
    });
  });

  it("includes optional description and capsVer when present", () => {
    const role = parseRole("role-1", {
      ...validRoleDoc,
      description: "Gestisce la clinica",
      capsVer: 7,
    });
    expect(role.description).toBe("Gestisce la clinica");
    expect(role.capsVer).toBe(7);
  });

  it("omits optional fields when absent", () => {
    const role = parseRole("role-1", validRoleDoc);
    expect("description" in role).toBe(false);
    expect("capsVer" in role).toBe(false);
  });

  it("copies the capabilities array (no shared reference)", () => {
    const role = parseRole("role-1", validRoleDoc);
    expect(role.capabilities).not.toBe(validRoleDoc.capabilities);
  });

  it("rejects an extra field via .strict()", () => {
    expect(() => parseRole("role-1", { ...validRoleDoc, ghost: true })).toThrow();
  });

  it("rejects a document missing a required field", () => {
    const { createdBy: _omit, ...without } = validRoleDoc;
    void _omit;
    expect(() => parseRole("role-1", without)).toThrow();
  });

  it("rejects an oversize name", () => {
    expect(() =>
      parseRole("role-1", { ...validRoleDoc, name: "n".repeat(61) })
    ).toThrow();
  });

  it("rejects more than 64 capabilities", () => {
    expect(() =>
      parseRole("role-1", {
        ...validRoleDoc,
        capabilities: Array(65).fill("aziende.read"),
      })
    ).toThrow();
  });

  it("rejects an unknown capability string", () => {
    expect(() =>
      parseRole("role-1", {
        ...validRoleDoc,
        capabilities: ["aziende.read", "totally.not.a.cap"],
      })
    ).toThrow();
  });

  it("rejects a wrong schemaVersion", () => {
    expect(() =>
      parseRole("role-1", { ...validRoleDoc, schemaVersion: 2 })
    ).toThrow();
  });
});
