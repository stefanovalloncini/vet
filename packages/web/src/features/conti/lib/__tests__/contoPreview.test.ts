import { describe, expect, it } from "vitest";
import type { Attivita, Azienda } from "@vet/shared";
import {
  computeContoPreview,
  
  defaultPeriodoFor,
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

