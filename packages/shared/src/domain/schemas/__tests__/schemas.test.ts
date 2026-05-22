import { describe, expect, it } from "vitest";
import { userInputSchema, userDocSchema } from "../user.js";
import { roleInputSchema, roleDocSchema } from "../role.js";
import {
  allowlistEntryInputSchema,
  allowlistEntryDocSchema,
} from "../allowlist.js";

describe("userInputSchema", () => {
  it("accepts a minimal valid input", () => {
    const r = userInputSchema.safeParse({
      email: "stefano@example.com",
      displayName: "Stefano",
      roleId: "vet",
    });
    expect(r.success).toBe(true);
  });

  it("rejects empty displayName", () => {
    const r = userInputSchema.safeParse({
      email: "x@y.com",
      displayName: "",
      roleId: "vet",
    });
    expect(r.success).toBe(false);
  });

  it("rejects displayName > 80 chars", () => {
    const r = userInputSchema.safeParse({
      email: "x@y.com",
      displayName: "x".repeat(81),
      roleId: "vet",
    });
    expect(r.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const r = userInputSchema.safeParse({
      email: "not-an-email",
      displayName: "X",
      roleId: "vet",
    });
    expect(r.success).toBe(false);
  });

  it("rejects extra fields in strict mode", () => {
    const r = userInputSchema.safeParse({
      email: "x@y.com",
      displayName: "X",
      roleId: "vet",
      sneaky: "field",
    });
    expect(r.success).toBe(false);
  });
});

describe("roleInputSchema", () => {
  it("accepts a valid role with capabilities", () => {
    const r = roleInputSchema.safeParse({
      name: "Veterinario",
      description: "Standard vet",
      capabilities: ["activities.read.all", "activities.create"],
    });
    expect(r.success).toBe(true);
  });

  it("rejects unknown capability", () => {
    const r = roleInputSchema.safeParse({
      name: "X",
      capabilities: ["activities.read.all", "fake.cap"],
    });
    expect(r.success).toBe(false);
  });

  it("rejects empty name", () => {
    const r = roleInputSchema.safeParse({
      name: "",
      capabilities: [],
    });
    expect(r.success).toBe(false);
  });

  it("rejects name longer than 60 chars", () => {
    expect(
      roleInputSchema.safeParse({
        name: "x".repeat(61),
        capabilities: [],
      }).success
    ).toBe(false);
  });

  it("rejects more than 64 capabilities", () => {
    expect(
      roleInputSchema.safeParse({
        name: "Big",
        capabilities: new Array(65).fill("activities.read.all"),
      }).success
    ).toBe(false);
  });

  it("rejects extra fields", () => {
    expect(
      roleInputSchema.safeParse({
        name: "X",
        capabilities: [],
        sneaky: true,
      }).success
    ).toBe(false);
  });
});

describe("roleDocSchema", () => {
  const base = {
    name: "Vet",
    capabilities: ["activities.read.all"] as ReadonlyArray<string>,
    locked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: "uid1",
    updatedBy: "uid1",
    schemaVersion: 1 as const,
  };

  it("accepts a valid doc", () => {
    expect(roleDocSchema.safeParse(base).success).toBe(true);
  });

  it("rejects createdBy longer than 128 chars", () => {
    expect(
      roleDocSchema.safeParse({ ...base, createdBy: "x".repeat(129) }).success
    ).toBe(false);
  });

  it("rejects extra fields", () => {
    expect(
      roleDocSchema.safeParse({ ...base, leak: true }).success
    ).toBe(false);
  });
});

describe("allowlistEntryInputSchema", () => {
  it("accepts a valid entry", () => {
    const r = allowlistEntryInputSchema.safeParse({
      email: "vet@example.com",
      defaultRoleId: "vet",
    });
    expect(r.success).toBe(true);
  });

  it("rejects entries without defaultRoleId", () => {
    const r = allowlistEntryInputSchema.safeParse({ email: "x@y.com" });
    expect(r.success).toBe(false);
  });

  it("accepts notes up to 500 chars, rejects longer", () => {
    expect(
      allowlistEntryInputSchema.safeParse({
        email: "a@b.com",
        defaultRoleId: "vet",
        notes: "x".repeat(500),
      }).success
    ).toBe(true);
    expect(
      allowlistEntryInputSchema.safeParse({
        email: "a@b.com",
        defaultRoleId: "vet",
        notes: "x".repeat(501),
      }).success
    ).toBe(false);
  });

  it("rejects emails starting with =+-@", () => {
    for (const bad of ["=x@y.it", "+x@y.it", "-x@y.it", "@x@y.it"]) {
      expect(
        allowlistEntryInputSchema.safeParse({
          email: bad,
          defaultRoleId: "vet",
        }).success
      ).toBe(false);
    }
  });

  it("rejects email longer than 120 chars", () => {
    expect(
      allowlistEntryInputSchema.safeParse({
        email: "a".repeat(116) + "@b.it",
        defaultRoleId: "vet",
      }).success
    ).toBe(false);
  });

  it("rejects extra fields", () => {
    expect(
      allowlistEntryInputSchema.safeParse({
        email: "a@b.com",
        defaultRoleId: "vet",
        sneaky: 1,
      }).success
    ).toBe(false);
  });
});

describe("allowlistEntryDocSchema", () => {
  const base = {
    email: "vet@example.com",
    defaultRoleId: "vet",
    invitedBy: "admin-uid",
    invitedAt: new Date(),
    schemaVersion: 1 as const,
  };

  it("accepts a valid doc", () => {
    expect(allowlistEntryDocSchema.safeParse(base).success).toBe(true);
  });

  it("rejects invitedBy longer than 128 chars", () => {
    expect(
      allowlistEntryDocSchema.safeParse({
        ...base,
        invitedBy: "x".repeat(129),
      }).success
    ).toBe(false);
  });

  it("rejects extra fields", () => {
    expect(
      allowlistEntryDocSchema.safeParse({ ...base, leak: true }).success
    ).toBe(false);
  });
});

describe("userDocSchema and roleDocSchema", () => {
  it("require server-stamped audit fields", () => {
    const now = new Date();
    const u = userDocSchema.safeParse({
      email: "x@y.com",
      displayName: "X",
      roleId: "vet",
      approved: true,
      disabled: false,
      createdAt: now,
      updatedAt: now,
      schemaVersion: 1,
    });
    expect(u.success).toBe(true);
  });
});
