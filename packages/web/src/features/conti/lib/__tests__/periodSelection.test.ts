import { describe, expect, it } from "vitest";
import {
  monthRange,
  quarterRange,
  semesterRange,
  yearRange,
  rangeForSelection,
  previousSelection,
  nextSelection,
  detectPeriodSelection,
  selectionFromNow,
  defaultPeriodoFor,
  periodoLabel,
  selectionLabel,
  type PeriodSelection,
} from "../periodSelection";

describe("period ranges", () => {
  it("monthRange covers the full calendar month", () => {
    const { from, to } = monthRange(2026, 2);
    expect(from).toEqual(new Date(2026, 1, 1));
    expect(to.getMonth()).toBe(1);
    expect(to.getDate()).toBe(28);
  });

  it("monthRange clamps an out-of-range month", () => {
    expect(monthRange(2026, 0).from).toEqual(new Date(2026, 0, 1));
    expect(monthRange(2026, 13).from).toEqual(new Date(2026, 11, 1));
  });

  it("quarterRange covers three months", () => {
    const { from, to } = quarterRange(2026, 2);
    expect(from).toEqual(new Date(2026, 3, 1));
    expect(to.getMonth()).toBe(5);
    expect(to.getDate()).toBe(30);
  });

  it("semesterRange covers six months", () => {
    const { from, to } = semesterRange(2026, 1);
    expect(from).toEqual(new Date(2026, 0, 1));
    expect(to.getMonth()).toBe(5);
  });

  it("yearRange covers the whole year", () => {
    const { from, to } = yearRange(2026);
    expect(from).toEqual(new Date(2026, 0, 1));
    expect(to.getMonth()).toBe(11);
    expect(to.getDate()).toBe(31);
  });

  it("rangeForSelection returns a NaN range for custom", () => {
    const r = rangeForSelection({ kind: "custom", year: 2026, index: 0 });
    expect(Number.isNaN(r.from.getTime())).toBe(true);
    expect(Number.isNaN(r.to.getTime())).toBe(true);
  });
});

describe("previousSelection / nextSelection wrap-around", () => {
  it("monthly wraps year boundaries", () => {
    expect(previousSelection({ kind: "monthly", year: 2026, index: 1 })).toEqual({
      kind: "monthly",
      year: 2025,
      index: 12,
    });
    expect(nextSelection({ kind: "monthly", year: 2026, index: 12 })).toEqual({
      kind: "monthly",
      year: 2027,
      index: 1,
    });
  });

  it("quarterly wraps", () => {
    expect(previousSelection({ kind: "quarterly", year: 2026, index: 1 })).toEqual({
      kind: "quarterly",
      year: 2025,
      index: 4,
    });
    expect(nextSelection({ kind: "quarterly", year: 2026, index: 4 })).toEqual({
      kind: "quarterly",
      year: 2027,
      index: 1,
    });
  });

  it("semiannual wraps", () => {
    expect(previousSelection({ kind: "semiannual", year: 2026, index: 1 })).toEqual({
      kind: "semiannual",
      year: 2025,
      index: 2,
    });
    expect(nextSelection({ kind: "semiannual", year: 2026, index: 2 })).toEqual({
      kind: "semiannual",
      year: 2027,
      index: 1,
    });
  });

  it("annual steps by year", () => {
    expect(previousSelection({ kind: "annual", year: 2026, index: 0 })).toEqual({
      kind: "annual",
      year: 2025,
      index: 0,
    });
    expect(nextSelection({ kind: "annual", year: 2026, index: 0 })).toEqual({
      kind: "annual",
      year: 2027,
      index: 0,
    });
  });
});

describe("detectPeriodSelection round-trips rangeForSelection", () => {
  const cases: PeriodSelection[] = [
    { kind: "monthly", year: 2026, index: 1 },
    { kind: "monthly", year: 2026, index: 2 },
    { kind: "monthly", year: 2026, index: 12 },
    { kind: "quarterly", year: 2026, index: 1 },
    { kind: "quarterly", year: 2026, index: 4 },
    { kind: "semiannual", year: 2026, index: 1 },
    { kind: "semiannual", year: 2026, index: 2 },
    { kind: "annual", year: 2026, index: 0 },
  ];
  for (const sel of cases) {
    it(`${sel.kind} #${sel.index} survives a round trip`, () => {
      const { from, to } = rangeForSelection(sel);
      expect(detectPeriodSelection(from, to)).toEqual(sel);
    });
  }

  it("returns custom for an arbitrary range", () => {
    expect(
      detectPeriodSelection(new Date(2026, 0, 3), new Date(2026, 1, 9)).kind
    ).toBe("custom");
  });

  it("returns custom for an inverted range", () => {
    expect(
      detectPeriodSelection(new Date(2026, 5, 1), new Date(2026, 0, 1)).kind
    ).toBe("custom");
  });
});

describe("selectionFromNow", () => {
  const now = new Date(2026, 4, 15);
  it("monthly uses the current month", () => {
    expect(selectionFromNow("monthly", now)).toEqual({
      kind: "monthly",
      year: 2026,
      index: 5,
    });
  });
  it("quarterly uses the current quarter", () => {
    expect(selectionFromNow("quarterly", now)).toEqual({
      kind: "quarterly",
      year: 2026,
      index: 2,
    });
  });
  it("semiannual picks H1 before July", () => {
    expect(selectionFromNow("semiannual", now)).toEqual({
      kind: "semiannual",
      year: 2026,
      index: 1,
    });
  });
  it("annual ignores the month", () => {
    expect(selectionFromNow("annual", now)).toEqual({
      kind: "annual",
      year: 2026,
      index: 0,
    });
  });
});

describe("defaultPeriodoFor", () => {
  const now = new Date(2026, 4, 15);
  it("uses the previous billing period when cadenza is set", () => {
    const { from, to } = defaultPeriodoFor({ cadenzaFatturazione: "monthly" }, now);
    expect(from).toEqual(new Date(2026, 3, 1));
    expect(to.getMonth()).toBe(3);
    expect(to.getDate()).toBe(30);
  });
  it("falls back to the last three months when no cadenza", () => {
    const { from, to } = defaultPeriodoFor(undefined, now);
    expect(from).toEqual(new Date(2026, 1, 1));
    expect(to.getMonth()).toBe(3);
    expect(to.getDate()).toBe(30);
  });
});

describe("labels", () => {
  it("labels a quarter, semester, and year", () => {
    expect(periodoLabel(...rangeTuple(quarterRange(2026, 2)))).toBe("T2 2026");
    expect(periodoLabel(...rangeTuple(semesterRange(2026, 2)))).toBe("S2 2026");
    expect(periodoLabel(...rangeTuple(yearRange(2026)))).toBe("2026");
  });
  it("selectionLabel returns Personalizzato for custom", () => {
    expect(selectionLabel({ kind: "custom", year: 2026, index: 0 })).toBe(
      "Personalizzato"
    );
  });
});

function rangeTuple(r: { from: Date; to: Date }): [Date, Date] {
  return [r.from, r.to];
}
