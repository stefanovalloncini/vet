import { describe, expect, it } from "vitest";
import type { Azienda, Conto } from "@vet/shared";
import { groupContiByAzienda } from "../groupContiByAzienda";
import { buildContiRows, sumDovuto } from "../buildContiRows";

function azienda(id: string, nome: string = id): Azienda {
  return {
    id,
    nome,
    nomeNorm: nome.toLowerCase(),
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    createdBy: "u1",
    updatedBy: "u1",
    createdByName: "U1",
    updatedByName: "U1",
    isDeleted: false,
    schemaVersion: 1,
  };
}

function conto(over: Partial<Conto>): Conto {
  return {
    id: over.id ?? "c1",
    aziendaId: over.aziendaId ?? "az1",
    aziendaNome: over.aziendaNome ?? "Azienda",
    periodoFrom: over.periodoFrom ?? new Date("2026-01-01T00:00:00Z"),
    periodoTo: over.periodoTo ?? new Date("2026-03-31T00:00:00Z"),
    attivitaIds: over.attivitaIds ?? ["a1"],
    totaleConto: over.totaleConto ?? 100,
    modalita: over.modalita ?? "emesso",
    saldato: over.saldato ?? false,
    emittedAt: over.emittedAt ?? new Date("2026-04-01T10:00:00Z"),
    emittedBy: over.emittedBy ?? "u1",
    emittedByName: over.emittedByName ?? "Vet One",
    isDeleted: over.isDeleted ?? false,
    schemaVersion: over.schemaVersion ?? 1,
  };
}

describe("buildContiRows", () => {
  it("excludes aziende that have no conti bucket", () => {
    const grouped = groupContiByAzienda([conto({ aziendaId: "az1" })]);
    const rows = buildContiRows([azienda("az1"), azienda("az2")], grouped, false);
    expect(rows.map((r) => r.azienda.id)).toEqual(["az1"]);
  });

  it("keeps only aziende with unsaldati when onlyUnsaldati is true", () => {
    const grouped = groupContiByAzienda([
      conto({ id: "c1", aziendaId: "az1", saldato: false }),
      conto({ id: "c2", aziendaId: "az2", saldato: true }),
    ]);
    const rows = buildContiRows([azienda("az1"), azienda("az2")], grouped, true);
    expect(rows.map((r) => r.azienda.id)).toEqual(["az1"]);
  });

  it("keeps all aziende with a bucket when onlyUnsaldati is false", () => {
    const grouped = groupContiByAzienda([
      conto({ id: "c1", aziendaId: "az1", saldato: false }),
      conto({ id: "c2", aziendaId: "az2", saldato: true }),
    ]);
    const rows = buildContiRows([azienda("az1"), azienda("az2")], grouped, false);
    expect([...rows.map((r) => r.azienda.id)].sort()).toEqual(["az1", "az2"]);
  });

  it("sorts rows by nomeNorm using Italian locale", () => {
    const grouped = groupContiByAzienda([
      conto({ id: "c1", aziendaId: "z" }),
      conto({ id: "c2", aziendaId: "a" }),
      conto({ id: "c3", aziendaId: "m" }),
    ]);
    const rows = buildContiRows(
      [azienda("z", "Zeta"), azienda("a", "alfa"), azienda("m", "Mu")],
      grouped,
      false
    );
    expect(rows.map((r) => r.azienda.nomeNorm)).toEqual(["alfa", "mu", "zeta"]);
  });
});

describe("sumDovuto", () => {
  it("returns 0 for no rows", () => {
    expect(sumDovuto([])).toBe(0);
  });

  it("sums bucket totaleUnsaldati across rows and rounds to cents", () => {
    const grouped = groupContiByAzienda([
      conto({ id: "c1", aziendaId: "az1", saldato: false, totaleConto: 33.34 }),
      conto({ id: "c2", aziendaId: "az2", saldato: false, totaleConto: 33.33 }),
      conto({ id: "c3", aziendaId: "az3", saldato: false, totaleConto: 33.33 }),
    ]);
    const rows = buildContiRows(
      [azienda("az1"), azienda("az2"), azienda("az3")],
      grouped,
      true
    );
    expect(sumDovuto(rows)).toBe(100);
  });
});
