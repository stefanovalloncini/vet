import { describe, expect, it } from "vitest";
import { sanitizeTel } from "../sanitizeTel";

describe("sanitizeTel", () => {
  it("keeps a standard Italian mobile number", () => {
    expect(sanitizeTel("+39 333 1234567")).toBe("+39 333 1234567");
  });

  it("keeps parentheses and dashes", () => {
    expect(sanitizeTel("+39 (333) 123-4567")).toBe("+39 (333) 123-4567");
  });

  it("strips letters", () => {
    expect(sanitizeTel("+39 333 abc 4567")).toBe("+39 333  4567");
  });

  it("strips colons (blocks javascript: scheme injection)", () => {
    expect(sanitizeTel("javascript:alert(1)")).toBe("(1)");
  });

  it("strips quotes and angle brackets", () => {
    expect(sanitizeTel('+39"><script>alert(1)</script>')).toBe("+39(1)");
  });

  it("returns empty string for empty input", () => {
    expect(sanitizeTel("")).toBe("");
  });

  it("returns empty string when only forbidden chars", () => {
    expect(sanitizeTel("javascript:")).toBe("");
  });
});
