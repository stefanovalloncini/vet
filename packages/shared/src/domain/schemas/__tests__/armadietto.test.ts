import { describe, expect, it } from "vitest";
import { monthsInPeriod, prorateArmadietto } from "../conto.js";

describe("monthsInPeriod", () => {
  it("counts a single calendar month as 1", () => {
    expect(monthsInPeriod(new Date(2026, 0, 1), new Date(2026, 0, 31))).toBe(1);
  });

  it("counts a clean quarter as 3", () => {
    expect(monthsInPeriod(new Date(2026, 0, 1), new Date(2026, 2, 31))).toBe(3);
  });

  it("counts a semester as 6 and a year as 12", () => {
    expect(monthsInPeriod(new Date(2026, 0, 1), new Date(2026, 5, 30))).toBe(6);
    expect(monthsInPeriod(new Date(2026, 0, 1), new Date(2026, 11, 31))).toBe(12);
  });

  it("spans across a year boundary", () => {
    expect(monthsInPeriod(new Date(2025, 10, 1), new Date(2026, 1, 28))).toBe(4);
  });

  it("ignores the time-of-day on the end bound", () => {
    const from = new Date(2026, 0, 1);
    const to = new Date(2026, 2, 31, 23, 59, 59, 999);
    expect(monthsInPeriod(from, to)).toBe(3);
  });
});

describe("prorateArmadietto", () => {
  it("splits the annual fee over a quarter (800/anno, trimestrale -> 200)", () => {
    expect(prorateArmadietto(800, new Date(2026, 0, 1), new Date(2026, 2, 31))).toBe(200);
  });

  it("returns the full fee for a whole year", () => {
    expect(prorateArmadietto(800, new Date(2026, 0, 1), new Date(2026, 11, 31))).toBe(800);
  });

  it("returns half for a semester", () => {
    expect(prorateArmadietto(800, new Date(2026, 0, 1), new Date(2026, 5, 30))).toBe(400);
  });

  it("rounds to two decimals (one month of 800 -> 66.67)", () => {
    expect(prorateArmadietto(800, new Date(2026, 0, 1), new Date(2026, 0, 31))).toBe(66.67);
  });

  it("handles a non-standard four-month period (800 -> 266.67)", () => {
    expect(prorateArmadietto(800, new Date(2026, 0, 1), new Date(2026, 3, 30))).toBe(266.67);
  });

  it("works with a fee that has decimals", () => {
    expect(prorateArmadietto(900, new Date(2026, 0, 1), new Date(2026, 2, 31))).toBe(225);
  });

  it("rounds a small fee correctly (100/anno, one month -> 8.33)", () => {
    expect(prorateArmadietto(100, new Date(2026, 0, 1), new Date(2026, 0, 31))).toBe(8.33);
  });
});
