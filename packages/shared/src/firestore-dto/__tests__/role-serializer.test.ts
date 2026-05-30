import { describe, expect, it } from "vitest";
import {
  buildRoleCreateDoc,
  buildRoleSeedDoc,
  buildRoleUpdatePatch,
  parseRole,
  roleNameKey,
} from "../role.js";
import type { Role } from "../../domain/entities/Role.js";
import type { RoleInput } from "../../domain/schemas/role.js";

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

const SERVER_TS = "SERVER_TS" as const;
const serverDeps = { serverTimestamp: () => SERVER_TS };

const baseInput: RoleInput = {
  name: "Veterinario capo",
  capabilities: ["aziende.read", "conti.emit", "conti.saldo"],
};

describe("roleNameKey", () => {
  it("trims, lowercases and slugifies disallowed characters", () => {
    expect(roleNameKey("  Veterinario Capo!  ")).toBe("veterinario-capo-");
  });

  it("preserves allowed characters and word separators", () => {
    expect(roleNameKey("vet_admin-2")).toBe("vet_admin-2");
  });

  it("replaces accented and unicode characters with dashes", () => {
    expect(roleNameKey("Référente")).toBe("r-f-rente");
  });
});

describe("buildRoleCreateDoc", () => {
  it("maps input + actor into a create payload with server stamps", () => {
    const payload = buildRoleCreateDoc(
      { input: baseInput, actor: "uid-admin" },
      serverDeps
    );
    expect(payload).toEqual({
      name: "Veterinario capo",
      capabilities: ["aziende.read", "conti.emit", "conti.saldo"],
      locked: false,
      createdAt: SERVER_TS,
      updatedAt: SERVER_TS,
      createdBy: "uid-admin",
      updatedBy: "uid-admin",
      schemaVersion: 1,
    });
  });

  it("includes description when present and omits it when absent", () => {
    expect(
      buildRoleCreateDoc(
        { input: { ...baseInput, description: "Gestisce la clinica" }, actor: "a" },
        serverDeps
      ).description
    ).toBe("Gestisce la clinica");
    expect(
      "description" in
        buildRoleCreateDoc({ input: baseInput, actor: "a" }, serverDeps)
    ).toBe(false);
  });

  it("copies the capabilities array (caller mutation does not leak)", () => {
    const capabilities = [...baseInput.capabilities];
    const payload = buildRoleCreateDoc(
      { input: { ...baseInput, capabilities }, actor: "a" },
      serverDeps
    );
    capabilities.push("audit.read");
    expect(payload.capabilities).toEqual([
      "aziende.read",
      "conti.emit",
      "conti.saldo",
    ]);
  });

  it("forces locked=false even though input cannot set it", () => {
    expect(
      buildRoleCreateDoc({ input: baseInput, actor: "a" }, serverDeps).locked
    ).toBe(false);
  });

  it("round-trips through parseRole with a real Date stamp", () => {
    const now = new Date("2026-05-01T10:00:00.000Z");
    const payload = buildRoleCreateDoc(
      { input: { ...baseInput, description: "capo" }, actor: "uid-admin" },
      { serverTimestamp: () => now }
    );
    const role = parseRole("role-1", payload);
    expect(role).toEqual({
      id: "role-1",
      name: "Veterinario capo",
      description: "capo",
      capabilities: ["aziende.read", "conti.emit", "conti.saldo"],
      locked: false,
      createdAt: now,
      updatedAt: now,
      createdBy: "uid-admin",
      updatedBy: "uid-admin",
      schemaVersion: 1,
    });
  });
});

describe("buildRoleUpdatePatch", () => {
  it("emits only mutable fields, omitting immutable ones", () => {
    const patch = buildRoleUpdatePatch(
      { input: baseInput, actor: "uid-editor" },
      serverDeps
    );
    expect(patch).toEqual({
      capabilities: ["aziende.read", "conti.emit", "conti.saldo"],
      updatedAt: SERVER_TS,
      updatedBy: "uid-editor",
    });
    expect("name" in patch).toBe(false);
    expect("locked" in patch).toBe(false);
    expect("createdAt" in patch).toBe(false);
    expect("createdBy" in patch).toBe(false);
    expect("schemaVersion" in patch).toBe(false);
  });

  it("includes description when present and omits it when absent", () => {
    expect(
      buildRoleUpdatePatch(
        { input: { ...baseInput, description: "nuova" }, actor: "a" },
        serverDeps
      ).description
    ).toBe("nuova");
    expect(
      "description" in
        buildRoleUpdatePatch({ input: baseInput, actor: "a" }, serverDeps)
    ).toBe(false);
  });

  it("copies the capabilities array (caller mutation does not leak)", () => {
    const capabilities = [...baseInput.capabilities];
    const patch = buildRoleUpdatePatch(
      { input: { ...baseInput, capabilities }, actor: "a" },
      serverDeps
    );
    capabilities.push("audit.read");
    expect(patch.capabilities).toEqual([
      "aziende.read",
      "conti.emit",
      "conti.saldo",
    ]);
  });
});

describe("buildRoleSeedDoc", () => {
  const role: Role = {
    id: "role-1",
    name: "Veterinario capo",
    capabilities: ["aziende.read", "conti.emit", "conti.saldo"],
    locked: true,
    createdAt,
    updatedAt,
    createdBy: "uid-seed",
    updatedBy: "uid-seed",
    schemaVersion: 1,
  };
  const seedDeps = {
    fromDate: (d: Date) => d,
    serverTimestamp: () => SERVER_TS,
  };

  it("uses deps.fromDate for both timestamps, not the server stamp", () => {
    const payload = buildRoleSeedDoc({ role }, seedDeps);
    expect(payload.createdAt).toBe(createdAt);
    expect(payload.updatedAt).toBe(updatedAt);
  });

  it("preserves locked from the source role", () => {
    expect(buildRoleSeedDoc({ role }, seedDeps).locked).toBe(true);
  });

  it("includes optional description and capsVer when present", () => {
    const payload = buildRoleSeedDoc(
      { role: { ...role, description: "capo", capsVer: 4 } },
      seedDeps
    );
    expect(payload.description).toBe("capo");
    expect(payload.capsVer).toBe(4);
  });

  it("omits optional description and capsVer when absent", () => {
    const payload = buildRoleSeedDoc({ role }, seedDeps);
    expect("description" in payload).toBe(false);
    expect("capsVer" in payload).toBe(false);
  });

  it("copies the capabilities array (caller mutation does not leak)", () => {
    const capabilities = [...role.capabilities];
    const payload = buildRoleSeedDoc(
      { role: { ...role, capabilities } },
      seedDeps
    );
    capabilities.push("audit.read");
    expect(payload.capabilities).toEqual([
      "aziende.read",
      "conti.emit",
      "conti.saldo",
    ]);
  });

  it("round-trips a full role through parseRole", () => {
    const payload = buildRoleSeedDoc(
      { role: { ...role, description: "capo", capsVer: 4 } },
      seedDeps
    );
    expect(parseRole("role-1", payload)).toEqual({
      id: "role-1",
      name: "Veterinario capo",
      description: "capo",
      capabilities: ["aziende.read", "conti.emit", "conti.saldo"],
      locked: true,
      capsVer: 4,
      createdAt,
      updatedAt,
      createdBy: "uid-seed",
      updatedBy: "uid-seed",
      schemaVersion: 1,
    });
  });
});
