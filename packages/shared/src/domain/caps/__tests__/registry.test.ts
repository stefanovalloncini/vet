import { describe, expect, it } from "vitest";
import { CAPABILITIES, capabilitySchema, isCapability } from "../registry";
import { CAPABILITY_LABELS } from "../labels";

describe("CAPABILITIES", () => {
  it("is a non-empty readonly tuple of strings", () => {
    expect(CAPABILITIES.length).toBeGreaterThan(0);
    expect(CAPABILITIES.every((c) => typeof c === "string")).toBe(true);
  });

  it("contains no duplicates", () => {
    const set = new Set(CAPABILITIES);
    expect(set.size).toBe(CAPABILITIES.length);
  });

  it("uses lowercase dot-separated identifiers", () => {
    for (const cap of CAPABILITIES) {
      expect(cap).toMatch(/^[a-z][a-z_]*(\.[a-z][a-z_]*)+$/);
    }
  });
});

describe("capabilitySchema", () => {
  it("accepts a known capability", () => {
    const result = capabilitySchema.safeParse("activities.create");
    expect(result.success).toBe(true);
  });

  it("rejects an unknown capability", () => {
    const result = capabilitySchema.safeParse("activities.invent");
    expect(result.success).toBe(false);
  });
});

describe("isCapability", () => {
  it("narrows known strings", () => {
    expect(isCapability("activities.create")).toBe(true);
  });

  it("returns false for unknown strings", () => {
    expect(isCapability("nonexistent.cap")).toBe(false);
  });
});

describe("CAPABILITY_LABELS", () => {
  it("has an Italian label for every capability", () => {
    for (const cap of CAPABILITIES) {
      expect(CAPABILITY_LABELS[cap]).toBeTruthy();
      expect(typeof CAPABILITY_LABELS[cap]).toBe("string");
    }
  });
});
