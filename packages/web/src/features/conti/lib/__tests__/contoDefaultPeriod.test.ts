import { describe, expect, it } from "vitest";
import type { Conto } from "@vet/shared";
import { contoDefaultPeriod } from "../contoDefaultPeriod";

function conto(overrides: Partial<Conto>): Conto {
  return {
    id: overrides.id ?? `c-${Math.random()}`,
    aziendaId: overrides.aziendaId ?? "az1",
    aziendaNome: "Cascina",
    periodoFrom: overrides.periodoFrom ?? new Date("2026-01-01T00:00:00"),
    periodoTo: overrides.periodoTo ?? new Date("2026-03-31T23:59:59.999"),
    attivitaIds: [],
    totaleConto: 100,
    modalita: overrides.modalita ?? "emesso",
    saldato: false,
    emittedAt: overrides.emittedAt ?? new Date("2026-05-01"),
    emittedBy: "u1",
    emittedByName: "Vet",
    isDeleted: overrides.isDeleted ?? false,
    schemaVersion: 1,
    ...overrides,
  } as Conto;
}

const NOW = new Date("2026-05-15T12:00:00");

describe("contoDefaultPeriod", () => {
  it("falls back to defaultPeriodoFor when there is no emitted conto", () => {
    const result = contoDefaultPeriod([], "quarterly", NOW);
    expect(result.from).toEqual(new Date(2026, 0, 1));
    expect(result.to).toEqual(new Date(2026, 2, 31, 23, 59, 59, 999));
  });

  it("falls back to the cadence period when only proforme exist", () => {
    const conti = [conto({ modalita: "proforma" })];
    const result = contoDefaultPeriod(conti, "quarterly", NOW);
    expect(result.from).toEqual(new Date(2026, 0, 1));
  });

  it("ignores deleted conti for the anchor", () => {
    const conti = [conto({ isDeleted: true })];
    const result = contoDefaultPeriod(conti, "quarterly", NOW);
    expect(result.from).toEqual(new Date(2026, 0, 1));
  });

  it("anchors from to the day after the most recent emitted periodoTo", () => {
    const conti = [
      conto({
        id: "c1",
        periodoTo: new Date("2026-03-31T23:59:59.999"),
      }),
    ];
    const result = contoDefaultPeriod(conti, "quarterly", NOW);
    expect(result.from).toEqual(new Date(2026, 3, 1));
  });

  it("uses the latest periodoTo when several emitted conti exist", () => {
    const conti = [
      conto({ id: "c1", periodoTo: new Date("2026-03-31T23:59:59.999") }),
      conto({ id: "c2", periodoTo: new Date("2026-04-30T23:59:59.999") }),
      conto({ id: "c3", periodoTo: new Date("2026-01-31T23:59:59.999") }),
    ];
    const result = contoDefaultPeriod(conti, "monthly", NOW);
    expect(result.from).toEqual(new Date(2026, 4, 1));
  });

  it("sets to to the end of the last complete cadence period", () => {
    const conti = [
      conto({ id: "c1", periodoTo: new Date("2026-01-31T23:59:59.999") }),
    ];
    const result = contoDefaultPeriod(conti, "quarterly", NOW);
    expect(result.to).toEqual(new Date(2026, 2, 31, 23, 59, 59, 999));
  });

  it("falls back to today end-of-day when already billed up to the cadence end", () => {
    const conti = [
      conto({ id: "c1", periodoTo: new Date("2026-03-31T23:59:59.999") }),
    ];
    const result = contoDefaultPeriod(conti, "quarterly", NOW);
    expect(result.from).toEqual(new Date(2026, 3, 1));
    expect(result.to).toEqual(new Date(2026, 4, 15, 23, 59, 59, 999));
    expect(result.to.getTime()).toBeGreaterThanOrEqual(result.from.getTime());
  });

  it("falls back to today end-of-day for to when cadenza is absent", () => {
    const conti = [
      conto({ id: "c1", periodoTo: new Date("2026-01-31T23:59:59.999") }),
    ];
    const result = contoDefaultPeriod(conti, undefined, NOW);
    expect(result.from).toEqual(new Date(2026, 1, 1));
    expect(result.to).toEqual(new Date(2026, 4, 15, 23, 59, 59, 999));
  });

  it("normalizes the anchored from to local midnight", () => {
    const conti = [
      conto({ id: "c1", periodoTo: new Date("2026-03-31T23:59:59.999") }),
    ];
    const result = contoDefaultPeriod(conti, "quarterly", NOW);
    expect(result.from.getHours()).toBe(0);
    expect(result.from.getMinutes()).toBe(0);
    expect(result.from.getSeconds()).toBe(0);
    expect(result.from.getMilliseconds()).toBe(0);
  });
});
