import { describe, it, expect } from "vitest";
import { rejectAccessRequestInputSchema } from "@vet/shared";

describe("rejectAccessRequestInputSchema", () => {
  it("accepts a plain email", () => {
    expect(rejectAccessRequestInputSchema.parse({ email: "a@b.com" })).toEqual({
      email: "a@b.com",
    });
  });

  it("rejects non-email strings", () => {
    expect(() => rejectAccessRequestInputSchema.parse({ email: "notanemail" })).toThrow();
  });

  it("rejects extra fields", () => {
    expect(() =>
      rejectAccessRequestInputSchema.parse({ email: "a@b.com", roleId: "x" })
    ).toThrow();
  });
});
