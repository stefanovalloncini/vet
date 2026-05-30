import { describe, expect, it } from "vitest";
import {
  CAPABILITIES,
  capCode,
  capabilitySchema,
  decodeCaps,
  encodeCaps,
  isCapability,
} from "../registry.js";
import { CAPABILITY_LABELS } from "../labels.js";

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

describe("short-code encoding", () => {
  it("assigns a unique short code to every capability", () => {
    const codes = CAPABILITIES.map((c) => capCode(c));
    expect(codes.every((c) => /^[a-z]+$/.test(c))).toBe(true);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("round-trips every capability through encode/decode", () => {
    const encoded = encodeCaps(CAPABILITIES);
    expect(decodeCaps(encoded)).toEqual([...CAPABILITIES]);
    for (const cap of CAPABILITIES) {
      expect(decodeCaps([capCode(cap)])).toEqual([cap]);
    }
  });

  it("also decodes full capability names (forward-compat) and drops unknown codes", () => {
    expect(decodeCaps(["activities.create"])).toEqual(["activities.create"]);
    expect(decodeCaps(["zzz", "ac", "nope"])).toEqual(["activities.create"]);
  });
});
