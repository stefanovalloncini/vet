import { describe, expect, it } from "vitest";
import {
  formatEuro,
  formatDate,
  dateInputValue,
  parseDateInput,
} from "../format";

describe("formatEuro", () => {
  it("renders with the euro symbol", () => {
    expect(formatEuro(50)).toContain("€");
  });

  it("uses comma as decimal separator (Italian locale)", () => {
    expect(formatEuro(50.25)).toContain("50,25");
  });

  it("handles zero with two decimals", () => {
    expect(formatEuro(0)).toMatch(/0,00/);
  });
});

describe("formatDate", () => {
  it("formats Italian dd/mm/yyyy", () => {
    expect(formatDate(new Date(2026, 4, 5))).toBe("05/05/2026");
  });
});

describe("dateInputValue", () => {
  it("formats as YYYY-MM-DD", () => {
    expect(dateInputValue(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("pads single-digit month and day", () => {
    expect(dateInputValue(new Date(2026, 8, 1))).toBe("2026-09-01");
  });

  it("preserves local-time fields (not UTC)", () => {
    const d = new Date(2026, 11, 31, 23, 59, 59);
    expect(dateInputValue(d)).toBe("2026-12-31");
  });
});

describe("parseDateInput", () => {
  it("parses YYYY-MM-DD into local midnight", () => {
    const d = parseDateInput("2026-05-05");
    expect(d).not.toBeNull();
    expect(d?.getFullYear()).toBe(2026);
    expect(d?.getMonth()).toBe(4);
    expect(d?.getDate()).toBe(5);
    expect(d?.getHours()).toBe(0);
  });

  it("returns null for malformed input", () => {
    expect(parseDateInput("bad")).toBeNull();
    expect(parseDateInput("")).toBeNull();
    expect(parseDateInput("2026-5-5")).toBeNull();
    expect(parseDateInput("2026/05/05")).toBeNull();
  });

  it("dateInputValue and parseDateInput round-trip", () => {
    const original = new Date(2026, 2, 14);
    const formatted = dateInputValue(original);
    const parsed = parseDateInput(formatted);
    expect(parsed?.getFullYear()).toBe(original.getFullYear());
    expect(parsed?.getMonth()).toBe(original.getMonth());
    expect(parsed?.getDate()).toBe(original.getDate());
  });
});
