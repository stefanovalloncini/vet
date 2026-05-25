import { describe, expect, it } from "vitest";
import { addDays, humanDays } from "../dates";

describe("addDays", () => {
  it("adds positive days", () => {
    const d = new Date(2026, 4, 25);
    const r = addDays(d, 5);
    expect(r.getDate()).toBe(30);
  });

  it("subtracts when negative", () => {
    const r = addDays(new Date(2026, 4, 25), -10);
    expect(r.getDate()).toBe(15);
  });

  it("crosses month boundary", () => {
    const r = addDays(new Date(2026, 4, 30), 5);
    expect(r.getMonth()).toBe(5);
    expect(r.getDate()).toBe(4);
  });

  it("does not mutate the original date", () => {
    const d = new Date(2026, 4, 25);
    const dataAtTimes = d.getTime();
    addDays(d, 5);
    expect(d.getTime()).toBe(dataAtTimes);
  });
});

describe("humanDays", () => {
  it("returns 'Fatto' when done is true regardless of days", () => {
    expect(humanDays(5, true)).toMatch(/fatto/i);
    expect(humanDays(-5, true)).toMatch(/fatto/i);
  });

  it("returns 'Oggi' for 0 days", () => {
    expect(humanDays(0, false)).toMatch(/oggi/i);
  });

  it("returns 'Domani' for 1 day", () => {
    expect(humanDays(1, false)).toMatch(/domani/i);
  });

  it("returns 'tra N giorni' for future days > 1", () => {
    expect(humanDays(7, false)).toMatch(/tra 7/i);
  });

  it("returns 'scaduto di N giorni' for negative days", () => {
    expect(humanDays(-3, false)).toMatch(/scaduto.*3/i);
  });
});
