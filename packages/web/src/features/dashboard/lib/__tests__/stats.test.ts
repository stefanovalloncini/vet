import { describe, expect, it } from "vitest";
import { makeAttivita } from "@vet/shared/testing";
import { statsForRange, topEntry, percentDiff, trailingMonths } from "../stats";

describe("trailingMonths", () => {
  it("returns 12 months of zeros when no items", () => {
    const result = trailingMonths([], new Date("2026-05-15"), 12);
    expect(result.totals).toHaveLength(12);
    expect(result.counts).toHaveLength(12);
    expect(result.labels).toHaveLength(12);
    expect(result.totals.every((t) => t === 0)).toBe(true);
    expect(result.counts.every((c) => c === 0)).toBe(true);
  });

  it("computes per-month totals and counts in parallel", () => {
    const items = [
      makeAttivita({ data: new Date("2026-05-10"), totale: 100 }),
      makeAttivita({ data: new Date("2026-05-20"), totale: 200 }),
      makeAttivita({ data: new Date("2026-04-15"), totale: 50 }),
    ];
    const result = trailingMonths(items, new Date("2026-05-15"), 12);
    expect(result.totals[11]).toBe(300);
    expect(result.counts[11]).toBe(2);
    expect(result.totals[10]).toBe(50);
    expect(result.counts[10]).toBe(1);
  });

  it("ignores items outside the trailing window", () => {
    const items = [
      makeAttivita({ data: new Date("2024-01-01"), totale: 999 }),
    ];
    const result = trailingMonths(items, new Date("2026-05-15"), 12);
    expect(result.totals.reduce((s, v) => s + v, 0)).toBe(0);
    expect(result.counts.reduce((s, v) => s + v, 0)).toBe(0);
  });

  it("respects the months argument", () => {
    const result = trailingMonths([], new Date("2026-05-15"), 6);
    expect(result.totals).toHaveLength(6);
    expect(result.counts).toHaveLength(6);
    expect(result.labels).toHaveLength(6);
  });

  it("totals and counts arrays have matching length", () => {
    const items = [
      makeAttivita({ data: new Date("2026-05-10"), totale: 100 }),
      makeAttivita({ data: new Date("2026-03-10"), totale: 100 }),
    ];
    const result = trailingMonths(items, new Date("2026-05-15"), 12);
    expect(result.totals.length).toBe(result.counts.length);
    expect(result.counts.length).toBe(result.labels.length);
  });
});

describe("statsForRange", () => {
  const from = new Date("2026-05-01T00:00:00");
  const to = new Date("2026-05-31T23:59:59");

  it("counts and sums only items inside the range", () => {
    const r = statsForRange(
      [
        makeAttivita({ data: new Date("2026-05-10"), totale: 100 }),
        makeAttivita({ data: new Date("2026-05-20"), totale: 50 }),
        makeAttivita({ data: new Date("2026-04-30"), totale: 999 }),
      ],
      from,
      to
    );
    expect(r.count).toBe(2);
    expect(r.total).toBe(150);
  });

  it("rounds the top-level total and every breakdown bucket total", () => {
    const r = statsForRange(
      [
        makeAttivita({ aziendaId: "a", tipoId: "t", data: new Date("2026-05-05"), totale: 0.1 }),
        makeAttivita({ aziendaId: "a", tipoId: "t", data: new Date("2026-05-06"), totale: 0.2 }),
      ],
      from,
      to
    );
    expect(r.total).toBe(0.3);
    expect(r.byAzienda.get("a")?.total).toBe(0.3);
    expect(r.byTipo.get("t")?.total).toBe(0.3);
  });

  it("groups by azienda and tipo with names, totals, and counts", () => {
    const r = statsForRange(
      [
        makeAttivita({ aziendaId: "a1", aziendaNome: "Uno", tipoId: "t1", tipoNome: "Visita", data: new Date("2026-05-05"), totale: 100 }),
        makeAttivita({ aziendaId: "a2", aziendaNome: "Due", tipoId: "t1", tipoNome: "Visita", data: new Date("2026-05-06"), totale: 40 }),
      ],
      from,
      to
    );
    expect(r.byAzienda.get("a1")).toEqual({ nome: "Uno", total: 100, count: 1 });
    expect(r.byTipo.get("t1")).toEqual({ nome: "Visita", total: 140, count: 2 });
  });
});

describe("topEntry", () => {
  it("returns the entry with the greatest total", () => {
    const map = new Map([
      ["a", { total: 10 }],
      ["b", { total: 30 }],
      ["c", { total: 20 }],
    ]);
    expect(topEntry(map)).toEqual({ key: "b", value: { total: 30 } });
  });

  it("returns null for an empty map", () => {
    expect(topEntry(new Map())).toBeNull();
  });
});

describe("percentDiff", () => {
  it("computes a rounded percentage change", () => {
    expect(percentDiff(150, 100)).toBe(50);
    expect(percentDiff(80, 100)).toBe(-20);
  });

  it("returns null when the previous value is zero", () => {
    expect(percentDiff(100, 0)).toBeNull();
  });
});
