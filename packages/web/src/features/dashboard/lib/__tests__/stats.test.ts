import { describe, expect, it } from "vitest";
import { trailingMonths } from "../stats";
import type { Attivita } from "@vet/shared";

function makeAttivita(overrides: Partial<Attivita>): Attivita {
  const now = new Date("2026-05-15T10:00:00Z");
  return {
    id: overrides.id ?? `a-${Math.random()}`,
    data: overrides.data ?? now,
    aziendaId: overrides.aziendaId ?? "az1",
    aziendaNome: overrides.aziendaNome ?? "Cascina",
    tipoId: overrides.tipoId ?? "visita",
    tipoNome: overrides.tipoNome ?? "Visita",
    oraria: overrides.oraria ?? false,
    tariffa: overrides.tariffa ?? 50,
    totale: overrides.totale ?? overrides.tariffa ?? 50,
    ownerUid: overrides.ownerUid ?? "u1",
    ownerEmail: overrides.ownerEmail ?? "u1@vet.com",
    ownerName: overrides.ownerName ?? "Vet One",
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    isDeleted: overrides.isDeleted ?? false,
  } as Attivita;
}

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
