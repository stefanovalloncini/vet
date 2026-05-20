import { describe, it, expect } from "vitest";
import { userDocSchema } from "../user.js";

describe("userDocSchema", () => {
  const base = {
    email: "a@b.com",
    displayName: "A",
    roleId: "vet",
    approved: true,
    disabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    schemaVersion: 1 as const,
  };

  it("accepts an approved user", () => {
    expect(userDocSchema.parse(base)).toEqual(base);
  });

  it("accepts a pending user", () => {
    const parsed = userDocSchema.parse({ ...base, approved: false });
    expect(parsed.approved).toBe(false);
  });

  it("accepts approvedAt and approvedBy when present", () => {
    const at = new Date();
    const parsed = userDocSchema.parse({ ...base, approvedAt: at, approvedBy: "admin" });
    expect(parsed.approvedAt).toEqual(at);
    expect(parsed.approvedBy).toBe("admin");
  });

  it("rejects a user without the approved field", () => {
    const { approved: _drop, ...rest } = base;
    expect(() => userDocSchema.parse(rest)).toThrow();
  });

  it("rejects extra fields", () => {
    expect(() => userDocSchema.parse({ ...base, extra: "x" })).toThrow();
  });

  it("rejects an empty approvedBy", () => {
    expect(() =>
      userDocSchema.parse({ ...base, approvedAt: new Date(), approvedBy: "" })
    ).toThrow();
  });
});
