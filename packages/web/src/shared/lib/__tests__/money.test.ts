import { describe, expect, it } from "vitest";
import { roundCents } from "../money";

describe("roundCents", () => {
  it("rounds to two decimals", () => {
    expect(roundCents(1234.5678)).toBe(1234.57);
    expect(roundCents(1234.5612)).toBe(1234.56);
  });

  it("leaves whole and 2-decimal values unchanged", () => {
    expect(roundCents(10)).toBe(10);
    expect(roundCents(19.99)).toBe(19.99);
  });

  it("collapses float drift from summation", () => {
    expect(roundCents(0.1 + 0.2)).toBe(0.3);
  });

  it("pins half-cent behavior (Math.round, IEEE-754)", () => {
    expect(roundCents(2.475)).toBe(2.48);
    expect(roundCents(2.465)).toBe(2.47);
  });
});
