import { describe, expect, it } from "vitest";
import type { Azienda, Conto } from "@vet/shared";
import { aziendeNeedingNewConto } from "../expirationCheck";
import { groupContiByAzienda } from "../groupContiByAzienda";

function azienda(overrides: Partial<Azienda>): Azienda {
  return {
    id: overrides.id ?? "az1",
    nome: overrides.nome ?? "Cascina",
    nomeNorm: (overrides.nome ?? "Cascina").toLowerCase(),
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    createdBy: "u1",
    updatedBy: "u1",
    createdByName: "U",
    updatedByName: "U",
    isDeleted: false,
    schemaVersion: 1,
    ...overrides,
  } as Azienda;
}

function conto(overrides: Partial<Conto>): Conto {
  return {
    id: overrides.id ?? `c-${Math.random()}`,
    aziendaId: overrides.aziendaId ?? "az1",
    aziendaNome: "Cascina",
    periodoFrom: new Date("2026-01-01"),
    periodoTo: new Date("2026-03-31"),
    attivitaIds: [],
    totaleConto: 100,
    modalita: "emesso",
    saldato: false,
    emittedAt: overrides.emittedAt ?? new Date("2026-05-01"),
    emittedBy: "u1",
    emittedByName: "Vet",
    isDeleted: false,
    schemaVersion: 1,
    ...overrides,
  } as Conto;
}

const NOW = new Date("2026-08-15T12:00:00Z");

describe("aziendeNeedingNewConto", () => {
  it("flags quarterly azienda whose last emit is older than 3 months", () => {
    const aziende = [azienda({ id: "az1", cadenzaFatturazione: "quarterly" })];
    const conti = [conto({ aziendaId: "az1", emittedAt: new Date("2026-04-01") })];
    const result = aziendeNeedingNewConto(aziende, groupContiByAzienda(conti), NOW);
    expect(result.has("az1")).toBe(true);
  });

  it("does not flag quarterly azienda emitted within last 3 months", () => {
    const aziende = [azienda({ id: "az1", cadenzaFatturazione: "quarterly" })];
    const conti = [conto({ aziendaId: "az1", emittedAt: new Date("2026-07-01") })];
    const result = aziendeNeedingNewConto(aziende, groupContiByAzienda(conti), NOW);
    expect(result.has("az1")).toBe(false);
  });

  it("flags monthly azienda older than 1 month", () => {
    const aziende = [azienda({ id: "az1", cadenzaFatturazione: "monthly" })];
    const conti = [conto({ aziendaId: "az1", emittedAt: new Date("2026-06-30") })];
    const result = aziendeNeedingNewConto(aziende, groupContiByAzienda(conti), NOW);
    expect(result.has("az1")).toBe(true);
  });

  it("flags semiannual azienda older than 6 months", () => {
    const aziende = [azienda({ id: "az1", cadenzaFatturazione: "semiannual" })];
    const conti = [conto({ aziendaId: "az1", emittedAt: new Date("2026-01-01") })];
    const result = aziendeNeedingNewConto(aziende, groupContiByAzienda(conti), NOW);
    expect(result.has("az1")).toBe(true);
  });

  it("does not flag azienda without cadenzaFatturazione", () => {
    const aziende = [azienda({ id: "az1" })];
    const conti = [conto({ aziendaId: "az1", emittedAt: new Date("2020-01-01") })];
    const result = aziendeNeedingNewConto(aziende, groupContiByAzienda(conti), NOW);
    expect(result.has("az1")).toBe(false);
  });

  it("does not flag azienda with no emitted conto at all", () => {
    const aziende = [azienda({ id: "az1", cadenzaFatturazione: "quarterly" })];
    const result = aziendeNeedingNewConto(aziende, groupContiByAzienda([]), NOW);
    expect(result.has("az1")).toBe(false);
  });

  it("considers the most recent emit per azienda (not just any conto)", () => {
    const aziende = [azienda({ id: "az1", cadenzaFatturazione: "quarterly" })];
    const conti = [
      conto({ id: "c-old", aziendaId: "az1", emittedAt: new Date("2026-01-01") }),
      conto({ id: "c-new", aziendaId: "az1", emittedAt: new Date("2026-07-15") }),
    ];
    const result = aziendeNeedingNewConto(aziende, groupContiByAzienda(conti), NOW);
    expect(result.has("az1")).toBe(false);
  });

  it("ignores aziende not present in the conti map", () => {
    const aziende = [
      azienda({ id: "az1", cadenzaFatturazione: "quarterly" }),
      azienda({ id: "az2", cadenzaFatturazione: "quarterly" }),
    ];
    const conti = [conto({ aziendaId: "az1", emittedAt: new Date("2026-04-01") })];
    const result = aziendeNeedingNewConto(aziende, groupContiByAzienda(conti), NOW);
    expect(result.has("az1")).toBe(true);
    expect(result.has("az2")).toBe(false);
  });
});
