import { describe, expect, it } from "vitest";
import type { Attivita, Azienda } from "@vet/shared";
import {
  computeContoPreview,
  defaultPeriodoFor,
  detectPeriodSelection,
  expectedLastPeriodoTo,
  monthRange,
  nextSelection,
  periodoLabel,
  previousFor,
  previousSelection,
  quarterRange,
  rangeForSelection,
  selectionFromNow,
  selectionLabel,
  semesterRange,
  yearRange,
  type PeriodSelection,
} from "../contoPreview";

function att(over: Partial<Attivita>): Attivita {
  return {
    id: "x",
    data: new Date("2026-02-15T10:00:00Z"),
    aziendaId: "az1",
    aziendaNome: "Cascina",
    tipoId: "tp1",
    tipoNome: "Visita",
    oraria: false,
    adElemento: false,
    tariffa: 100,
    totale: 100,
    ownerUid: "u1",
    ownerEmail: "u1@x.it",
    ownerName: "U1",
    createdAt: new Date("2026-02-15T10:00:00Z"),
    updatedAt: new Date("2026-02-15T10:00:00Z"),
    isDeleted: false,
    schemaVersion: 1,
    ...over,
  };
}

describe("computeContoPreview", () => {
  const from = new Date("2026-02-01T00:00:00Z");
  const to = new Date("2026-02-28T23:59:59Z");

  it("only includes attivita matching aziendaId", async () => {
    const items: Attivita[] = [
      att({ id: "a1", aziendaId: "az1", totale: 100 }),
      att({ id: "a2", aziendaId: "az2", totale: 200 }),
      att({ id: "a3", aziendaId: "az1", totale: 50 }),
    ];
    const out = computeContoPreview(items, "az1", from, to);
    expect(out.attivitaIds).toEqual(["a1", "a3"]);
    expect(out.count).toBe(2);
    expect(out.totaleConto).toBe(150);
  });

  it("excludes soft-deleted attivita", async () => {
    const items: Attivita[] = [
      att({ id: "a1", aziendaId: "az1", totale: 100 }),
      att({ id: "a2", aziendaId: "az1", totale: 100, isDeleted: true }),
    ];
    const out = computeContoPreview(items, "az1", from, to);
    expect(out.attivitaIds).toEqual(["a1"]);
    expect(out.count).toBe(1);
    expect(out.totaleConto).toBe(100);
  });

  it("excludes attivita before periodoFrom or after periodoTo", async () => {
    const items: Attivita[] = [
      att({ id: "before", aziendaId: "az1", data: new Date("2026-01-31T23:59:59Z") }),
      att({ id: "in1", aziendaId: "az1", data: new Date("2026-02-01T00:00:00Z") }),
      att({ id: "in2", aziendaId: "az1", data: new Date("2026-02-28T23:59:59Z") }),
      att({ id: "after", aziendaId: "az1", data: new Date("2026-03-01T00:00:00Z") }),
    ];
    const out = computeContoPreview(items, "az1", from, to);
    expect(out.attivitaIds).toEqual(["in1", "in2"]);
  });

  it("rounds totale to 2 decimals", async () => {
    const items: Attivita[] = [
      att({ id: "a1", aziendaId: "az1", totale: 33.333 }),
      att({ id: "a2", aziendaId: "az1", totale: 33.333 }),
      att({ id: "a3", aziendaId: "az1", totale: 33.334 }),
    ];
    const out = computeContoPreview(items, "az1", from, to);
    expect(out.totaleConto).toBe(100);
  });

  it("rounds with float drift compensation", async () => {
    const items: Attivita[] = [
      att({ id: "a1", aziendaId: "az1", totale: 0.1 }),
      att({ id: "a2", aziendaId: "az1", totale: 0.2 }),
    ];
    const out = computeContoPreview(items, "az1", from, to);
    expect(out.totaleConto).toBe(0.3);
  });

  it("returns attivitaIds preserving input order", async () => {
    const items: Attivita[] = [
      att({ id: "z", aziendaId: "az1", totale: 1 }),
      att({ id: "a", aziendaId: "az1", totale: 1 }),
      att({ id: "m", aziendaId: "az1", totale: 1 }),
    ];
    const out = computeContoPreview(items, "az1", from, to);
    expect(out.attivitaIds).toEqual(["z", "a", "m"]);
  });

  it("returns an empty preview when no items match", async () => {
    const items: Attivita[] = [
      att({ id: "a1", aziendaId: "az2", totale: 100 }),
    ];
    const out = computeContoPreview(items, "az1", from, to);
    expect(out).toEqual({ attivitaIds: [], totaleConto: 0, count: 0 });
  });
});

describe("defaultPeriodoFor", () => {
  function azienda(
    cadenza: Azienda["cadenzaFatturazione"]
  ): Pick<Azienda, "cadenzaFatturazione"> | undefined {
    return cadenza ? { cadenzaFatturazione: cadenza } : undefined;
  }

  it("monthly returns the prior calendar month", () => {
    const now = new Date(2026, 4, 15); // may 15
    const { from, to } = defaultPeriodoFor(azienda("monthly"), now);
    expect(from.getFullYear()).toBe(2026);
    expect(from.getMonth()).toBe(3); // april
    expect(from.getDate()).toBe(1);
    expect(to.getFullYear()).toBe(2026);
    expect(to.getMonth()).toBe(3); // last day of april
    expect(to.getDate()).toBe(30);
  });

  it("monthly in january returns december of previous year", () => {
    const now = new Date(2026, 0, 10); // january
    const { from, to } = defaultPeriodoFor(azienda("monthly"), now);
    expect(from.getFullYear()).toBe(2025);
    expect(from.getMonth()).toBe(11); // december
    expect(to.getFullYear()).toBe(2025);
    expect(to.getMonth()).toBe(11);
    expect(to.getDate()).toBe(31);
  });

  it("quarterly in Q2 returns Q1 (gen-mar)", () => {
    const now = new Date(2026, 4, 15); // may, inside Q2
    const { from, to } = defaultPeriodoFor(azienda("quarterly"), now);
    expect(from.getFullYear()).toBe(2026);
    expect(from.getMonth()).toBe(0); // january
    expect(from.getDate()).toBe(1);
    expect(to.getFullYear()).toBe(2026);
    expect(to.getMonth()).toBe(2); // march
    expect(to.getDate()).toBe(31);
  });

  it("quarterly in Q3 returns Q2 (apr-giu)", () => {
    const now = new Date(2026, 7, 10); // august, inside Q3
    const { from, to } = defaultPeriodoFor(azienda("quarterly"), now);
    expect(from.getMonth()).toBe(3); // april
    expect(from.getDate()).toBe(1);
    expect(to.getMonth()).toBe(5); // june
    expect(to.getDate()).toBe(30);
  });

  it("quarterly in Q4 returns Q3 (lug-set)", () => {
    const now = new Date(2026, 10, 20); // november, inside Q4
    const { from, to } = defaultPeriodoFor(azienda("quarterly"), now);
    expect(from.getMonth()).toBe(6); // july
    expect(from.getDate()).toBe(1);
    expect(to.getMonth()).toBe(8); // september
    expect(to.getDate()).toBe(30);
  });

  it("quarterly in Q1 returns previous Q4 of prior year", () => {
    const now = new Date(2026, 1, 10); // february, inside Q1
    const { from, to } = defaultPeriodoFor(azienda("quarterly"), now);
    expect(from.getFullYear()).toBe(2025);
    expect(from.getMonth()).toBe(9); // october
    expect(from.getDate()).toBe(1);
    expect(to.getFullYear()).toBe(2025);
    expect(to.getMonth()).toBe(11); // december
    expect(to.getDate()).toBe(31);
  });

  it("semiannual in H1 returns previous H2 (lug-dic of prior year)", () => {
    const now = new Date(2026, 4, 15); // may, inside H1
    const { from, to } = defaultPeriodoFor(azienda("semiannual"), now);
    expect(from.getFullYear()).toBe(2025);
    expect(from.getMonth()).toBe(6); // july
    expect(from.getDate()).toBe(1);
    expect(to.getFullYear()).toBe(2025);
    expect(to.getMonth()).toBe(11); // december
    expect(to.getDate()).toBe(31);
  });

  it("semiannual in H2 returns H1 (gen-giu)", () => {
    const now = new Date(2026, 8, 10); // september, inside H2
    const { from, to } = defaultPeriodoFor(azienda("semiannual"), now);
    expect(from.getFullYear()).toBe(2026);
    expect(from.getMonth()).toBe(0); // january
    expect(from.getDate()).toBe(1);
    expect(to.getFullYear()).toBe(2026);
    expect(to.getMonth()).toBe(5); // june
    expect(to.getDate()).toBe(30);
  });

  it("defaults to rolling 3 months when azienda is undefined", () => {
    const now = new Date(2026, 4, 15); // may 15
    const { from, to } = defaultPeriodoFor(undefined, now);
    expect(from.getMonth()).toBe(1); // february
    expect(from.getDate()).toBe(1);
    expect(to.getMonth()).toBe(3); // april
    expect(to.getDate()).toBe(30);
  });

  it("defaults to rolling 3 months when cadenzaFatturazione is missing", () => {
    const now = new Date(2026, 4, 15);
    const { from, to } = defaultPeriodoFor({}, now);
    expect(from.getMonth()).toBe(1);
    expect(to.getMonth()).toBe(3);
  });
});

describe("monthRange", () => {
  it("returns the full january range", () => {
    const r = monthRange(2026, 1);
    expect(r.from).toEqual(new Date(2026, 0, 1));
    expect(r.to).toEqual(new Date(2026, 0, 31, 23, 59, 59, 999));
  });
  it("returns the full december range", () => {
    const r = monthRange(2026, 12);
    expect(r.from).toEqual(new Date(2026, 11, 1));
    expect(r.to).toEqual(new Date(2026, 11, 31, 23, 59, 59, 999));
  });
  it("handles february in a leap year (29 days)", () => {
    const r = monthRange(2024, 2);
    expect(r.to.getDate()).toBe(29);
  });
  it("handles february in a non-leap year (28 days)", () => {
    const r = monthRange(2026, 2);
    expect(r.to.getDate()).toBe(28);
  });
  it("clamps month indices below 1 or above 12", () => {
    expect(monthRange(2026, 0).from.getMonth()).toBe(0);
    expect(monthRange(2026, 13).from.getMonth()).toBe(11);
  });
});

describe("quarterRange", () => {
  it("Q1 = jan-mar", () => {
    const r = quarterRange(2026, 1);
    expect(r.from).toEqual(new Date(2026, 0, 1));
    expect(r.to.getMonth()).toBe(2);
    expect(r.to.getDate()).toBe(31);
  });
  it("Q4 = oct-dec", () => {
    const r = quarterRange(2026, 4);
    expect(r.from.getMonth()).toBe(9);
    expect(r.to.getMonth()).toBe(11);
    expect(r.to.getDate()).toBe(31);
  });
});

describe("semesterRange", () => {
  it("S1 = jan-jun", () => {
    const r = semesterRange(2026, 1);
    expect(r.from.getMonth()).toBe(0);
    expect(r.to.getMonth()).toBe(5);
    expect(r.to.getDate()).toBe(30);
  });
  it("S2 = jul-dec", () => {
    const r = semesterRange(2026, 2);
    expect(r.from.getMonth()).toBe(6);
    expect(r.to.getMonth()).toBe(11);
    expect(r.to.getDate()).toBe(31);
  });
});

describe("yearRange", () => {
  it("covers jan 1 to dec 31", () => {
    const r = yearRange(2026);
    expect(r.from).toEqual(new Date(2026, 0, 1));
    expect(r.to.getMonth()).toBe(11);
    expect(r.to.getDate()).toBe(31);
  });
});

describe("rangeForSelection", () => {
  it("delegates to monthRange/quarterRange/semesterRange/yearRange", () => {
    expect(rangeForSelection({ kind: "monthly", year: 2026, index: 3 }).from.getMonth()).toBe(2);
    expect(rangeForSelection({ kind: "quarterly", year: 2026, index: 2 }).from.getMonth()).toBe(3);
    expect(rangeForSelection({ kind: "semiannual", year: 2026, index: 2 }).from.getMonth()).toBe(6);
    expect(rangeForSelection({ kind: "annual", year: 2026, index: 0 }).from.getMonth()).toBe(0);
  });
  it("returns NaN dates for custom kind", () => {
    const r = rangeForSelection({ kind: "custom", year: 2026, index: 0 });
    expect(Number.isNaN(r.from.getTime())).toBe(true);
  });
});

describe("previousSelection / nextSelection", () => {
  it("monthly wraps from january to december of previous year", () => {
    const sel: PeriodSelection = { kind: "monthly", year: 2026, index: 1 };
    expect(previousSelection(sel)).toEqual({ kind: "monthly", year: 2025, index: 12 });
  });
  it("monthly wraps from december to january of next year", () => {
    const sel: PeriodSelection = { kind: "monthly", year: 2025, index: 12 };
    expect(nextSelection(sel)).toEqual({ kind: "monthly", year: 2026, index: 1 });
  });
  it("quarterly wraps Q1 to Q4 prev year", () => {
    expect(previousSelection({ kind: "quarterly", year: 2026, index: 1 })).toEqual({
      kind: "quarterly",
      year: 2025,
      index: 4,
    });
  });
  it("quarterly wraps Q4 to Q1 next year", () => {
    expect(nextSelection({ kind: "quarterly", year: 2025, index: 4 })).toEqual({
      kind: "quarterly",
      year: 2026,
      index: 1,
    });
  });
  it("semiannual wraps S1 to S2 prev year and S2 to S1 next year", () => {
    expect(previousSelection({ kind: "semiannual", year: 2026, index: 1 })).toEqual({
      kind: "semiannual",
      year: 2025,
      index: 2,
    });
    expect(nextSelection({ kind: "semiannual", year: 2025, index: 2 })).toEqual({
      kind: "semiannual",
      year: 2026,
      index: 1,
    });
  });
  it("annual just decrements / increments year", () => {
    expect(previousSelection({ kind: "annual", year: 2026, index: 0 })).toEqual({
      kind: "annual",
      year: 2025,
      index: 0,
    });
    expect(nextSelection({ kind: "annual", year: 2025, index: 0 })).toEqual({
      kind: "annual",
      year: 2026,
      index: 0,
    });
  });
  it("custom is identity (cannot step)", () => {
    const sel: PeriodSelection = { kind: "custom", year: 2026, index: 0 };
    expect(previousSelection(sel)).toEqual(sel);
    expect(nextSelection(sel)).toEqual(sel);
  });
});

describe("detectPeriodSelection", () => {
  it("detects a full month", () => {
    const r = monthRange(2026, 4);
    const sel = detectPeriodSelection(r.from, r.to);
    expect(sel).toEqual({ kind: "monthly", year: 2026, index: 4 });
  });
  it("detects a full quarter", () => {
    const r = quarterRange(2025, 3);
    const sel = detectPeriodSelection(r.from, r.to);
    expect(sel).toEqual({ kind: "quarterly", year: 2025, index: 3 });
  });
  it("detects a full semester (S1 and S2)", () => {
    expect(detectPeriodSelection(semesterRange(2026, 1).from, semesterRange(2026, 1).to)).toEqual({
      kind: "semiannual",
      year: 2026,
      index: 1,
    });
    expect(detectPeriodSelection(semesterRange(2026, 2).from, semesterRange(2026, 2).to)).toEqual({
      kind: "semiannual",
      year: 2026,
      index: 2,
    });
  });
  it("detects a full year", () => {
    const r = yearRange(2026);
    expect(detectPeriodSelection(r.from, r.to)).toEqual({
      kind: "annual",
      year: 2026,
      index: 0,
    });
  });
  it("detects february in a leap year as a full month", () => {
    const r = monthRange(2024, 2); // 29 days
    const sel = detectPeriodSelection(r.from, r.to);
    expect(sel).toEqual({ kind: "monthly", year: 2024, index: 2 });
  });
  it("returns custom when range is not aligned to a calendar period", () => {
    const from = new Date(2026, 0, 15);
    const to = new Date(2026, 2, 14, 23, 59, 59, 999);
    const sel = detectPeriodSelection(from, to);
    expect(sel.kind).toBe("custom");
  });
  it("returns custom when from > to", () => {
    const from = new Date(2026, 5, 1);
    const to = new Date(2026, 0, 1);
    expect(detectPeriodSelection(from, to).kind).toBe("custom");
  });
  it("returns custom for invalid dates", () => {
    const inv = new Date(NaN);
    expect(detectPeriodSelection(inv, inv).kind).toBe("custom");
  });
  it("does NOT detect a quarter when day count is one short", () => {
    const from = new Date(2026, 0, 1);
    const to = new Date(2026, 2, 30, 23, 59, 59, 999); // mar 30, not mar 31
    expect(detectPeriodSelection(from, to).kind).toBe("custom");
  });
});

describe("selectionFromNow / previousFor", () => {
  it("selectionFromNow(monthly) returns current month", () => {
    const sel = selectionFromNow("monthly", new Date(2026, 4, 15));
    expect(sel).toEqual({ kind: "monthly", year: 2026, index: 5 });
  });
  it("previousFor(quarterly) in Q1 returns Q4 of previous year", () => {
    const sel = previousFor("quarterly", new Date(2026, 1, 1));
    expect(sel).toEqual({ kind: "quarterly", year: 2025, index: 4 });
  });
  it("previousFor(semiannual) in jan returns S2 of previous year", () => {
    const sel = previousFor("semiannual", new Date(2026, 0, 5));
    expect(sel).toEqual({ kind: "semiannual", year: 2025, index: 2 });
  });
});

describe("periodoLabel", () => {
  it("formats quarterly as T<n> <year>", () => {
    const r = quarterRange(2026, 1);
    expect(periodoLabel(r.from, r.to, "quarterly")).toBe("T1 2026");
  });
  it("formats semestre as S<n> <year>", () => {
    const r = semesterRange(2026, 2);
    expect(periodoLabel(r.from, r.to, "semiannual")).toBe("S2 2026");
  });
  it("formats month as short_month_it <year>", () => {
    const r = monthRange(2026, 4);
    expect(periodoLabel(r.from, r.to, "monthly")).toBe("Apr 2026");
  });
  it("formats year as just the year", () => {
    const r = yearRange(2026);
    expect(periodoLabel(r.from, r.to)).toBe("2026");
  });
  it("falls back to from–to month labels for custom ranges", () => {
    const from = new Date(2026, 0, 15);
    const to = new Date(2026, 2, 14);
    expect(periodoLabel(from, to)).toBe("Gen 2026 – Mar 2026");
  });
});

describe("selectionLabel", () => {
  it("labels each kind correctly", () => {
    expect(selectionLabel({ kind: "monthly", year: 2026, index: 7 })).toBe("Lug 2026");
    expect(selectionLabel({ kind: "quarterly", year: 2026, index: 3 })).toBe("T3 2026");
    expect(selectionLabel({ kind: "semiannual", year: 2026, index: 1 })).toBe("S1 2026");
    expect(selectionLabel({ kind: "annual", year: 2026, index: 0 })).toBe("2026");
    expect(selectionLabel({ kind: "custom", year: 0, index: 0 })).toBe("Personalizzato");
  });
});

describe("expectedLastPeriodoTo (compat with refactored helpers)", () => {
  it("quarterly in Q2 (may) returns mar 31", () => {
    const d = expectedLastPeriodoTo("quarterly", new Date(2026, 4, 25));
    expect(d.getMonth()).toBe(2);
    expect(d.getDate()).toBe(31);
  });
  it("quarterly in Q1 (jan) returns dec 31 of previous year", () => {
    const d = expectedLastPeriodoTo("quarterly", new Date(2026, 0, 5));
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(11);
    expect(d.getDate()).toBe(31);
  });
  it("monthly in january returns dec 31 of previous year", () => {
    const d = expectedLastPeriodoTo("monthly", new Date(2026, 0, 5));
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(11);
    expect(d.getDate()).toBe(31);
  });
  it("semiannual in march returns dec 31 of previous year", () => {
    const d = expectedLastPeriodoTo("semiannual", new Date(2026, 2, 10));
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(11);
    expect(d.getDate()).toBe(31);
  });
});
