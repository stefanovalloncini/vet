import { describe, expect, it } from "vitest";
import type { Attivita, Azienda, CadenzaFatturazione } from "@vet/shared";
import {
  filtersForRange,
  byTipoSlices,
  topClientsSlices,
  monthlyComparisonOf,
  stackedMonthsOf,
  funnelOf,
} from "../useStatistiche";

function att(over: Partial<Attivita>): Attivita {
  return {
    id: "a1",
    data: new Date(2026, 4, 1),
    aziendaId: "az1",
    aziendaNome: "Azienda 1",
    tipoId: "t1",
    tipoNome: "Visita",
    oraria: false,
    adElemento: false,
    tariffa: 10,
    totale: 100,
    ownerUid: "u1",
    ownerEmail: "u1@example.com",
    ownerName: "Owner",
    createdAt: new Date(2026, 4, 1),
    updatedAt: new Date(2026, 4, 1),
    isDeleted: false,
    schemaVersion: 1,
    ...over,
  };
}

function az(id: string, cadenza?: CadenzaFatturazione): Azienda {
  return {
    id,
    nome: id,
    nomeNorm: id,
    ...(cadenza ? { cadenzaFatturazione: cadenza } : {}),
    createdAt: new Date(2026, 0, 1),
    updatedAt: new Date(2026, 0, 1),
    createdBy: "u1",
    updatedBy: "u1",
    createdByName: "T",
    updatedByName: "T",
    isDeleted: false,
    schemaVersion: 1,
  };
}

describe("filtersForRange", () => {
  const now = new Date(2026, 4, 15);
  it("ytd → Jan 1 of this year to now", () => {
    const f = filtersForRange("ytd", now);
    expect(f.from).toEqual(new Date(2026, 0, 1));
    expect(f.to).toBe(now);
  });
  it("12m → first day twelve months back", () => {
    expect(filtersForRange("12m", now).from).toEqual(new Date(2025, 5, 1));
  });
  it("all → no bounds", () => {
    expect(filtersForRange("all", now)).toEqual({});
  });
});

describe("byTipoSlices", () => {
  it("sums totale per tipo, sorted descending", () => {
    const r = byTipoSlices([
      att({ tipoId: "t1", tipoNome: "A", totale: 100 }),
      att({ tipoId: "t1", totale: 50 }),
      att({ tipoId: "t2", tipoNome: "B", totale: 200 }),
    ]);
    expect(r).toEqual([
      { label: "B", value: 200 },
      { label: "A", value: 150 },
    ]);
  });
});

describe("topClientsSlices", () => {
  it("sums value and counts visits per azienda, sorted descending", () => {
    const r = topClientsSlices([
      att({ aziendaId: "a1", aziendaNome: "A", totale: 100 }),
      att({ aziendaId: "a1", totale: 50 }),
      att({ aziendaId: "a2", aziendaNome: "B", totale: 200 }),
    ]);
    expect(r).toEqual([
      { label: "B", value: 200, count: 1 },
      { label: "A", value: 150, count: 2 },
    ]);
  });
});

describe("monthlyComparisonOf", () => {
  it("splits this-year (year-checked) and last-year totals by month", () => {
    const now = new Date(2026, 4, 15);
    const r = monthlyComparisonOf(
      [att({ data: new Date(2026, 3, 1), totale: 100 }), att({ data: new Date(2025, 3, 1), totale: 999 })],
      [att({ data: new Date(2025, 3, 1), totale: 50 })],
      now
    );
    expect(r.thisYear[3]).toBe(100);
    expect(r.thisYear[2]).toBe(0);
    expect(r.lastYear[3]).toBe(50);
  });
});

describe("stackedMonthsOf", () => {
  it("buckets into 12 months and skips anything before the cutoff, crossing the year boundary", () => {
    const now = new Date(2026, 1, 15); // Feb 2026 → cutoff = March 2025
    const r = stackedMonthsOf(
      [
        att({ data: new Date(2025, 2, 10), totale: 100 }), // March 2025 = months[0]
        att({ data: new Date(2026, 1, 5), totale: 50 }), // Feb 2026 = months[11]
        att({ data: new Date(2025, 1, 1), totale: 999 }), // Feb 2025 → before cutoff, skipped
      ],
      now
    );
    expect(r).toHaveLength(12);
    expect(r[0]!.total).toBe(100);
    expect(r[11]!.total).toBe(50);
    expect(r.reduce((s, m) => s + m.total, 0)).toBe(150);
  });
});

describe("funnelOf", () => {
  it("counts visits and visits inside aziende with a billing cadence", () => {
    const r = funnelOf(
      [att({ aziendaId: "a1" }), att({ aziendaId: "a2" }), att({ aziendaId: "a1" })],
      [az("a1", "monthly"), az("a2")]
    );
    expect(r[0]!.value).toBe(3);
    expect(r[1]!.value).toBe(2);
  });
});
