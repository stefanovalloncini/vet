import { describe, expect, it } from "vitest";
import { computeMl } from "../dosaggio";

describe("computeMl", () => {
  it("computes peso * dose / conc rounded to two decimals", () => {
    expect(computeMl(600, 1, 50)).toBe(12);
    expect(computeMl(10, 2.5, 3)).toBe(8.33);
  });

  it("returns null for any empty field", () => {
    expect(computeMl("", 1, 50)).toBeNull();
    expect(computeMl(600, "", 50)).toBeNull();
    expect(computeMl(600, 1, "")).toBeNull();
  });

  it("returns null for a zero concentration (no divide-by-zero)", () => {
    expect(computeMl(600, 1, 0)).toBeNull();
  });

  it("returns null for zero or negative weight, dose, or concentration", () => {
    expect(computeMl(0, 1, 50)).toBeNull();
    expect(computeMl(-5, 1, 50)).toBeNull();
    expect(computeMl(600, 0, 50)).toBeNull();
    expect(computeMl(600, -1, 50)).toBeNull();
    expect(computeMl(600, 1, -50)).toBeNull();
  });

  it("returns null for non-finite inputs", () => {
    expect(computeMl(Number.NaN, 1, 50)).toBeNull();
    expect(computeMl(Number.POSITIVE_INFINITY, 1, 50)).toBeNull();
    expect(computeMl(600, Number.NaN, 50)).toBeNull();
  });

  it("handles a very large weight without producing a non-finite result", () => {
    expect(computeMl(999999999, 10, 50)).toBe(199999999.8);
  });
});
