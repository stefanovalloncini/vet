import { describe, expect, it } from "vitest";
import { userInputSchema, userDocSchema } from "../user.js";
import { roleInputSchema } from "../role.js";
import { allowlistEntryInputSchema } from "../allowlist.js";

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
});

describe("userDocSchema and roleDocSchema", () => {
  it("require server-stamped audit fields", () => {
    const now = new Date();
    const u = userDocSchema.safeParse({
      email: "x@y.com",
      displayName: "X",
      roleId: "vet",
      disabled: false,
      createdAt: now,
      updatedAt: now,
      schemaVersion: 1,
    });
    expect(u.success).toBe(true);
  });
});
