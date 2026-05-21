import { describe, it, expect } from "vitest";
import { meanTariffaByTipo, isTariffaOutOfRange } from "../tariffStats";
import type { Attivita } from "@vet/shared";

function item(
  overrides: Partial<Attivita> & Pick<Attivita, "tipoId" | "tariffa">
): Attivita {
  const base = {
    id: "x",
    data: new Date("2026-01-01"),
    aziendaId: "az1",
    aziendaNome: "Az",
    tipoNome: "T",
    note: "",
    oraria: false,
    ore: 0,
    totale: overrides.tariffa,
    ownerUid: "u",
    ownerEmail: "e",
    ownerName: "n",
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: "u",
    schemaVersion: 1,
  };
  return { ...base, ...overrides } as Attivita;
}

describe("meanTariffaByTipo", () => {
  it("returns empty map for empty input", () => {
    expect(meanTariffaByTipo([])).toEqual(new Map());
  });

  it("ignores tipi with fewer than 3 samples", () => {
    const m = meanTariffaByTipo([
      item({ tipoId: "a", tariffa: 50 }),
      item({ tipoId: "a", tariffa: 100 }),
    ]);
    expect(m.has("a")).toBe(false);
  });

  it("averages tariffas with 3+ samples", () => {
    const m = meanTariffaByTipo([
      item({ tipoId: "a", tariffa: 50 }),
      item({ tipoId: "a", tariffa: 100 }),
      item({ tipoId: "a", tariffa: 150 }),
    ]);
    expect(m.get("a")).toBe(100);
  });

  it("excludes non-positive tariffas from the sample", () => {
    const m = meanTariffaByTipo([
      item({ tipoId: "a", tariffa: 50 }),
      item({ tipoId: "a", tariffa: 0 }),
      item({ tipoId: "a", tariffa: 100 }),
      item({ tipoId: "a", tariffa: 150 }),
    ]);
    expect(m.get("a")).toBe(100);
  });

  it("partitions by tipoId", () => {
    const m = meanTariffaByTipo([
      item({ tipoId: "a", tariffa: 10 }),
      item({ tipoId: "a", tariffa: 20 }),
      item({ tipoId: "a", tariffa: 30 }),
      item({ tipoId: "b", tariffa: 200 }),
      item({ tipoId: "b", tariffa: 300 }),
      item({ tipoId: "b", tariffa: 400 }),
    ]);
    expect(m.get("a")).toBe(20);
    expect(m.get("b")).toBe(300);
  });
});

describe("isTariffaOutOfRange", () => {
  const meanByTipo = new Map([["a", 100]]);

  it("returns null when tariffa is null", () => {
    expect(isTariffaOutOfRange({ tariffa: null, tipoId: "a", meanByTipo })).toBeNull();
  });

  it("returns null when tariffa is zero or negative", () => {
    expect(isTariffaOutOfRange({ tariffa: 0, tipoId: "a", meanByTipo })).toBeNull();
    expect(isTariffaOutOfRange({ tariffa: -10, tipoId: "a", meanByTipo })).toBeNull();
  });

  it("returns null when tipoId is empty", () => {
    expect(isTariffaOutOfRange({ tariffa: 50, tipoId: "", meanByTipo })).toBeNull();
  });

  it("returns null when no mean is known for the tipo", () => {
    expect(isTariffaOutOfRange({ tariffa: 50, tipoId: "z", meanByTipo })).toBeNull();
  });

  it("returns the mean when tariffa is below half the mean", () => {
    expect(isTariffaOutOfRange({ tariffa: 40, tipoId: "a", meanByTipo })).toBe(100);
  });

  it("returns the mean when tariffa is above double the mean", () => {
    expect(isTariffaOutOfRange({ tariffa: 210, tipoId: "a", meanByTipo })).toBe(100);
  });

  it("returns null when tariffa is within the half-to-double range", () => {
    expect(isTariffaOutOfRange({ tariffa: 51, tipoId: "a", meanByTipo })).toBeNull();
    expect(isTariffaOutOfRange({ tariffa: 199, tipoId: "a", meanByTipo })).toBeNull();
    expect(isTariffaOutOfRange({ tariffa: 100, tipoId: "a", meanByTipo })).toBeNull();
  });
});
