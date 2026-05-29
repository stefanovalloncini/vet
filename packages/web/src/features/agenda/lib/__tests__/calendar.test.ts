import { describe, expect, it } from "vitest";
import type { Attivita } from "@vet/shared";
import {
  addDays,
  buildWeekStrip,
  endOfMonth,
  groupWeekByWeekday,
  sameDay,
  startOfMonth,
  startOfWeek,
} from "../calendar";

function attivita(data: Date, over: Partial<Attivita> = {}): Attivita {
  return {
    id: `a-${data.getTime()}`,
    data,
    aziendaId: "az1",
    aziendaNome: "Cascina Verde",
    tipoId: "t1",
    tipoNome: "Visita",
    oraria: false,
    adElemento: false,
    tariffa: 40,
    totale: 40,
    ownerUid: "u1",
    ownerEmail: "u1@vet.com",
    ownerName: "Vet One",
    createdAt: data,
    updatedAt: data,
    isDeleted: false,
    schemaVersion: 1,
    ...over,
  };
}

describe("startOfWeek", () => {
  it("returns the same date when called on a Monday", () => {
    const mon = new Date(2026, 4, 25); // 25 May 2026 is Monday
    const r = startOfWeek(mon);
    expect(sameDay(r, mon)).toBe(true);
  });

  it("returns the previous Monday when called on a Sunday", () => {
    const sun = new Date(2026, 4, 24); // 24 May = Sunday
    const r = startOfWeek(sun);
    expect(sameDay(r, new Date(2026, 4, 18))).toBe(true);
  });

  it("returns the Monday of the same week when called on a Friday", () => {
    const fri = new Date(2026, 4, 29);
    const r = startOfWeek(fri);
    expect(sameDay(r, new Date(2026, 4, 25))).toBe(true);
  });
});

describe("addDays", () => {
  it("adds positive days", () => {
    const d = new Date(2026, 4, 25);
    expect(sameDay(addDays(d, 3), new Date(2026, 4, 28))).toBe(true);
  });

  it("subtracts when negative", () => {
    expect(sameDay(addDays(new Date(2026, 4, 25), -5), new Date(2026, 4, 20))).toBe(
      true
    );
  });

  it("crosses month boundary correctly", () => {
    expect(sameDay(addDays(new Date(2026, 4, 30), 5), new Date(2026, 5, 4))).toBe(
      true
    );
  });
});

describe("sameDay", () => {
  it("returns true for same-day dates with different times", () => {
    expect(
      sameDay(
        new Date(2026, 4, 25, 9, 0, 0),
        new Date(2026, 4, 25, 23, 59, 59)
      )
    ).toBe(true);
  });

  it("returns false for different days", () => {
    expect(sameDay(new Date(2026, 4, 25), new Date(2026, 4, 26))).toBe(false);
  });

  it("returns false for different months/years", () => {
    expect(sameDay(new Date(2026, 4, 25), new Date(2026, 3, 25))).toBe(false);
    expect(sameDay(new Date(2026, 4, 25), new Date(2025, 4, 25))).toBe(false);
  });
});

describe("buildWeekStrip", () => {
  it("returns 7 days starting from Monday", () => {
    const w = buildWeekStrip(new Date(2026, 4, 27)); // wed
    expect(w).toHaveLength(7);
    expect(sameDay(w[0]!.date, new Date(2026, 4, 25))).toBe(true);
    expect(sameDay(w[6]!.date, new Date(2026, 4, 31))).toBe(true);
  });

  it("flags isToday correctly", () => {
    const today = new Date(2026, 4, 27);
    const w = buildWeekStrip(today, today);
    expect(w.find((d) => sameDay(d.date, today))?.isToday).toBe(true);
    expect(w.filter((d) => d.isToday)).toHaveLength(1);
  });
});

describe("groupWeekByWeekday", () => {
  it("returns 7 columns Monday-first", () => {
    const cols = groupWeekByWeekday(new Date(2026, 4, 27), []);
    expect(cols).toHaveLength(7);
    expect(sameDay(cols[0]!.date, new Date(2026, 4, 25))).toBe(true);
    expect(sameDay(cols[6]!.date, new Date(2026, 4, 31))).toBe(true);
  });

  it("buckets activities into the matching weekday", () => {
    const mon = attivita(new Date(2026, 4, 25, 9, 0));
    const wed = attivita(new Date(2026, 4, 27, 14, 0));
    const cols = groupWeekByWeekday(new Date(2026, 4, 27), [mon, wed]);
    expect(cols[0]!.items).toEqual([mon]);
    expect(cols[1]!.items).toEqual([]);
    expect(cols[2]!.items).toEqual([wed]);
  });

  it("sorts each day's activities by time ascending", () => {
    const late = attivita(new Date(2026, 4, 25, 16, 0));
    const early = attivita(new Date(2026, 4, 25, 8, 30));
    const cols = groupWeekByWeekday(new Date(2026, 4, 25), [late, early]);
    expect(cols[0]!.items.map((a) => a.id)).toEqual([early.id, late.id]);
  });

  it("ignores activities outside the visible week", () => {
    const outside = attivita(new Date(2026, 5, 2, 9, 0));
    const cols = groupWeekByWeekday(new Date(2026, 4, 27), [outside]);
    expect(cols.flatMap((c) => c.items)).toHaveLength(0);
  });

  it("flags the today column", () => {
    const today = new Date(2026, 4, 27);
    const cols = groupWeekByWeekday(today, [], today);
    expect(cols.filter((c) => c.isToday)).toHaveLength(1);
    expect(cols.find((c) => c.isToday)?.date.getDate()).toBe(27);
  });
});

describe("startOfMonth / endOfMonth", () => {
  it("startOfMonth returns day 1 at midnight", () => {
    const r = startOfMonth(new Date(2026, 4, 15));
    expect(r.getDate()).toBe(1);
    expect(r.getHours()).toBe(0);
  });

  it("endOfMonth returns last day at 23:59:59.999", () => {
    const r = endOfMonth(new Date(2026, 4, 15));
    expect(r.getDate()).toBe(31); // May
    expect(r.getHours()).toBe(23);
    expect(r.getMilliseconds()).toBe(999);
  });

  it("endOfMonth in february non-leap returns 28", () => {
    expect(endOfMonth(new Date(2026, 1, 10)).getDate()).toBe(28);
  });

  it("endOfMonth in february leap-year returns 29", () => {
    expect(endOfMonth(new Date(2024, 1, 10)).getDate()).toBe(29);
  });
});
