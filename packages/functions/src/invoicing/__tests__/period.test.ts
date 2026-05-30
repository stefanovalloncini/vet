import { describe, expect, it } from "vitest";
import { isCadenzaDue, periodFor } from "../period.js";

describe("isCadenzaDue", () => {
  it("monthly is due every month", () => {
    for (let m = 1; m <= 12; m++) {
      expect(isCadenzaDue("monthly", new Date(Date.UTC(2026, m - 1, 10)))).toBe(true);
    }
  });

  it("quarterly is due on jan/apr/jul/oct only", () => {
    expect(isCadenzaDue("quarterly", new Date(Date.UTC(2026, 0, 10)))).toBe(true);
    expect(isCadenzaDue("quarterly", new Date(Date.UTC(2026, 3, 10)))).toBe(true);
    expect(isCadenzaDue("quarterly", new Date(Date.UTC(2026, 6, 10)))).toBe(true);
    expect(isCadenzaDue("quarterly", new Date(Date.UTC(2026, 9, 10)))).toBe(true);
    expect(isCadenzaDue("quarterly", new Date(Date.UTC(2026, 1, 10)))).toBe(false);
    expect(isCadenzaDue("quarterly", new Date(Date.UTC(2026, 4, 10)))).toBe(false);
  });

  it("semiannual is due on jan/jul only", () => {
    expect(isCadenzaDue("semiannual", new Date(Date.UTC(2026, 0, 10)))).toBe(true);
    expect(isCadenzaDue("semiannual", new Date(Date.UTC(2026, 6, 10)))).toBe(true);
    expect(isCadenzaDue("semiannual", new Date(Date.UTC(2026, 3, 10)))).toBe(false);
  });
});

describe("periodFor", () => {
  it("monthly bills the previous month", () => {
    const p = periodFor("monthly", new Date(Date.UTC(2026, 4, 10)));
    expect(p.start.toISOString()).toBe("2026-04-01T00:00:00.000Z");
    expect(p.end.toISOString()).toBe("2026-04-30T23:59:59.999Z");
    expect(p.label).toBe("Aprile 2026");
  });

  it("monthly January rolls back to prior year December", () => {
    const p = periodFor("monthly", new Date(Date.UTC(2026, 0, 10)));
    expect(p.start.toISOString()).toBe("2025-12-01T00:00:00.000Z");
    expect(p.end.toISOString()).toBe("2025-12-31T23:59:59.999Z");
    expect(p.label).toBe("Dicembre 2025");
  });

  it("quarterly bills the previous 3 months", () => {
    const p = periodFor("quarterly", new Date(Date.UTC(2026, 3, 10)));
    expect(p.start.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(p.end.toISOString()).toBe("2026-03-31T23:59:59.999Z");
    expect(p.label).toBe("Gennaio – Marzo 2026");
  });

  it("quarterly January rolls back to prior year Q4", () => {
    const p = periodFor("quarterly", new Date(Date.UTC(2026, 0, 10)));
    expect(p.start.toISOString()).toBe("2025-10-01T00:00:00.000Z");
    expect(p.end.toISOString()).toBe("2025-12-31T23:59:59.999Z");
    expect(p.label).toBe("Ottobre – Dicembre 2025");
  });

  it("semiannual bills last 6 months", () => {
    const p = periodFor("semiannual", new Date(Date.UTC(2026, 6, 10)));
    expect(p.start.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(p.end.toISOString()).toBe("2026-06-30T23:59:59.999Z");
    expect(p.label).toBe("Gennaio – Giugno 2026");
  });

  it("semiannual January rolls back to prior year H2", () => {
    const p = periodFor("semiannual", new Date(Date.UTC(2026, 0, 10)));
    expect(p.start.toISOString()).toBe("2025-07-01T00:00:00.000Z");
    expect(p.end.toISOString()).toBe("2025-12-31T23:59:59.999Z");
    expect(p.label).toBe("Luglio – Dicembre 2025");
  });
});
