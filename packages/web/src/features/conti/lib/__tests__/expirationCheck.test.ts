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
    periodoFrom: new Date(2026, 0, 1),
    periodoTo: new Date(2026, 2, 31, 23, 59, 59, 999),
    attivitaIds: [],
    totaleConto: 100,
    modalita: "emesso",
    saldato: false,
    emittedAt: overrides.emittedAt ?? new Date(2026, 3, 5),
    emittedBy: "u1",
    emittedByName: "Vet",
    isDeleted: false,
    schemaVersion: 1,
    ...overrides,
  } as Conto;
}

const NOW = new Date(2026, 7, 15);

describe("aziendeNeedingNewConto", () => {
  it("flags a quarterly azienda whose only conto covers an earlier quarter", () => {
    const aziende = [azienda({ id: "az1", cadenzaFatturazione: "quarterly" })];
    const conti = [
      conto({
        aziendaId: "az1",
        periodoFrom: new Date(2026, 0, 1),
        periodoTo: new Date(2026, 2, 31, 23, 59, 59, 999),
      }),
    ];
    const result = aziendeNeedingNewConto(aziende, groupContiByAzienda(conti), NOW);
    expect(result.has("az1")).toBe(true);
  });

  it("does not flag when an emitted conto covers the previous calendar quarter", () => {
    const aziende = [azienda({ id: "az1", cadenzaFatturazione: "quarterly" })];
    const conti = [
      conto({
        aziendaId: "az1",
        periodoFrom: new Date(2026, 3, 1),
        periodoTo: new Date(2026, 5, 30, 23, 59, 59, 999),
      }),
    ];
    const result = aziendeNeedingNewConto(aziende, groupContiByAzienda(conti), NOW);
    expect(result.has("az1")).toBe(false);
  });

  it("ignores a proforma conto for coverage (still flags)", () => {
    const aziende = [azienda({ id: "az1", cadenzaFatturazione: "quarterly" })];
    const conti = [
      conto({
        aziendaId: "az1",
        periodoFrom: new Date(2026, 3, 1),
        periodoTo: new Date(2026, 5, 30, 23, 59, 59, 999),
        modalita: "proforma",
      }),
    ];
    const result = aziendeNeedingNewConto(aziende, groupContiByAzienda(conti), NOW);
    expect(result.has("az1")).toBe(true);
  });

  it("ignores a deleted conto for coverage (still flags)", () => {
    const aziende = [azienda({ id: "az1", cadenzaFatturazione: "quarterly" })];
    const conti = [
      conto({
        aziendaId: "az1",
        periodoFrom: new Date(2026, 3, 1),
        periodoTo: new Date(2026, 5, 30, 23, 59, 59, 999),
        isDeleted: true,
      }),
    ];
    const result = aziendeNeedingNewConto(aziende, groupContiByAzienda(conti), NOW);
    expect(result.has("az1")).toBe(true);
  });

  it("does not flag a monthly azienda whose conto covers the previous month", () => {
    const aziende = [azienda({ id: "az1", cadenzaFatturazione: "monthly" })];
    const conti = [
      conto({
        aziendaId: "az1",
        periodoFrom: new Date(2026, 6, 1),
        periodoTo: new Date(2026, 6, 31, 23, 59, 59, 999),
      }),
    ];
    const result = aziendeNeedingNewConto(aziende, groupContiByAzienda(conti), NOW);
    expect(result.has("az1")).toBe(false);
  });

  it("flags a monthly azienda whose conto covers an older month", () => {
    const aziende = [azienda({ id: "az1", cadenzaFatturazione: "monthly" })];
    const conti = [
      conto({
        aziendaId: "az1",
        periodoFrom: new Date(2026, 4, 1),
        periodoTo: new Date(2026, 4, 31, 23, 59, 59, 999),
      }),
    ];
    const result = aziendeNeedingNewConto(aziende, groupContiByAzienda(conti), NOW);
    expect(result.has("az1")).toBe(true);
  });

  it("does not flag a semiannual azienda whose conto covers the previous semester", () => {
    const aziende = [azienda({ id: "az1", cadenzaFatturazione: "semiannual" })];
    const conti = [
      conto({
        aziendaId: "az1",
        periodoFrom: new Date(2026, 0, 1),
        periodoTo: new Date(2026, 5, 30, 23, 59, 59, 999),
      }),
    ];
    const result = aziendeNeedingNewConto(aziende, groupContiByAzienda(conti), NOW);
    expect(result.has("az1")).toBe(false);
  });

  it("does not flag an azienda without cadenzaFatturazione", () => {
    const aziende = [azienda({ id: "az1" })];
    const conti = [
      conto({
        aziendaId: "az1",
        periodoFrom: new Date(2020, 0, 1),
        periodoTo: new Date(2020, 2, 31, 23, 59, 59, 999),
      }),
    ];
    const result = aziendeNeedingNewConto(aziende, groupContiByAzienda(conti), NOW);
    expect(result.has("az1")).toBe(false);
  });

  it("does not flag an azienda with no conto at all", () => {
    const aziende = [azienda({ id: "az1", cadenzaFatturazione: "quarterly" })];
    const result = aziendeNeedingNewConto(aziende, groupContiByAzienda([]), NOW);
    expect(result.has("az1")).toBe(false);
  });

  it("does not flag when any emitted conto covers the previous period", () => {
    const aziende = [azienda({ id: "az1", cadenzaFatturazione: "quarterly" })];
    const conti = [
      conto({
        id: "c-old",
        aziendaId: "az1",
        periodoFrom: new Date(2026, 0, 1),
        periodoTo: new Date(2026, 2, 31, 23, 59, 59, 999),
      }),
      conto({
        id: "c-prev",
        aziendaId: "az1",
        periodoFrom: new Date(2026, 3, 1),
        periodoTo: new Date(2026, 5, 30, 23, 59, 59, 999),
      }),
    ];
    const result = aziendeNeedingNewConto(aziende, groupContiByAzienda(conti), NOW);
    expect(result.has("az1")).toBe(false);
  });

  it("ignores aziende not present in the conti map", () => {
    const aziende = [
      azienda({ id: "az1", cadenzaFatturazione: "quarterly" }),
      azienda({ id: "az2", cadenzaFatturazione: "quarterly" }),
    ];
    const conti = [
      conto({
        aziendaId: "az1",
        periodoFrom: new Date(2026, 0, 1),
        periodoTo: new Date(2026, 2, 31, 23, 59, 59, 999),
      }),
    ];
    const result = aziendeNeedingNewConto(aziende, groupContiByAzienda(conti), NOW);
    expect(result.has("az1")).toBe(true);
    expect(result.has("az2")).toBe(false);
  });
});
