import { describe, expect, it } from "vitest";
import { QUICK_RANGES } from "../quickRanges";

// Wed 13 May 2026 (local). mondayIndex -> 2, so the week is Mon 11 .. Sun 17.
const NOW = new Date(2026, 4, 13);

function range(id: string): { from: string; to: string } {
  const r = QUICK_RANGES.find((q) => q.id === id);
  if (!r) throw new Error(`no quick range: ${id}`);
  return r.compute(NOW);
}

describe("QUICK_RANGES compute", () => {
  it("today is a single day", () => {
    expect(range("today")).toEqual({ from: "2026-05-13", to: "2026-05-13" });
  });

  it("week spans Monday to Sunday around the date", () => {
    expect(range("week")).toEqual({ from: "2026-05-11", to: "2026-05-17" });
  });

  it("month covers the full calendar month", () => {
    expect(range("month")).toEqual({ from: "2026-05-01", to: "2026-05-31" });
  });

  it("lastmonth covers the previous calendar month", () => {
    expect(range("lastmonth")).toEqual({ from: "2026-04-01", to: "2026-04-30" });
  });

  it("year covers Jan 1 to Dec 31", () => {
    expect(range("year")).toEqual({ from: "2026-01-01", to: "2026-12-31" });
  });

  it("exposes exactly the five expected ranges in order", () => {
    expect(QUICK_RANGES.map((q) => q.id)).toEqual([
      "today",
      "week",
      "month",
      "lastmonth",
      "year",
    ]);
  });
});
