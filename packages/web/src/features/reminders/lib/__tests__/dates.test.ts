import { describe, expect, it } from "vitest";
import { addDays, daysUntil, humanDays } from "../dates";

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

describe("daysUntil", () => {
  it("returns 0 for any time today", () => {
    expect(daysUntil(new Date())).toBe(0);
  });

  it("counts whole days forward and backward", () => {
    const now = new Date();
    expect(daysUntil(addDays(now, 1))).toBe(1);
    expect(daysUntil(addDays(now, -1))).toBe(-1);
    expect(daysUntil(addDays(now, 30))).toBe(30);
    expect(daysUntil(addDays(now, -30))).toBe(-30);
  });

  it("ignores the time of day (normalizes to midnight)", () => {
    const target = addDays(new Date(), 5);
    const morning = new Date(target);
    morning.setHours(2, 0, 0, 0);
    const evening = new Date(target);
    evening.setHours(22, 30, 0, 0);
    expect(daysUntil(morning)).toBe(daysUntil(evening));
    expect(daysUntil(morning)).toBe(5);
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
