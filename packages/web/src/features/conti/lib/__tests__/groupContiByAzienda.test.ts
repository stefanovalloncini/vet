import { describe, expect, it } from "vitest";
import type { Conto } from "@vet/shared";
import { groupContiByAzienda } from "../groupContiByAzienda";

function conto(over: Partial<Conto>): Conto {
  return {
    id: over.id ?? "c1",
    aziendaId: over.aziendaId ?? "az1",
    aziendaNome: over.aziendaNome ?? "Cascina Verdi",
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

describe("groupContiByAzienda", () => {
  it("returns an empty map when there are no conti", () => {
    expect(groupContiByAzienda([]).size).toBe(0);
  });

  it("groups conti by aziendaId", () => {
    const grouped = groupContiByAzienda([
      conto({ id: "c1", aziendaId: "az1" }),
      conto({ id: "c2", aziendaId: "az2" }),
      conto({ id: "c3", aziendaId: "az1" }),
    ]);
    expect(grouped.get("az1")?.conti.map((c) => c.id)).toEqual(["c1", "c3"]);
    expect(grouped.get("az2")?.conti.map((c) => c.id)).toEqual(["c2"]);
  });

  it("flags hasUnsaldati when any conto is emesso and non-saldato", () => {
    const grouped = groupContiByAzienda([
      conto({ id: "c1", aziendaId: "az1", saldato: true }),
      conto({ id: "c2", aziendaId: "az1", saldato: false }),
    ]);
    expect(grouped.get("az1")?.hasUnsaldati).toBe(true);
    expect(grouped.get("az1")?.unsaldatiCount).toBe(1);
  });

  it("ignores pro forma and saldati when summing totaleUnsaldati", () => {
    const grouped = groupContiByAzienda([
      conto({ id: "c1", aziendaId: "az1", modalita: "proforma", totaleConto: 1000 }),
      conto({ id: "c2", aziendaId: "az1", saldato: true, totaleConto: 500 }),
      conto({ id: "c3", aziendaId: "az1", saldato: false, totaleConto: 200 }),
      conto({ id: "c4", aziendaId: "az1", saldato: false, totaleConto: 50.5 }),
    ]);
    const az1 = grouped.get("az1");
    expect(az1?.unsaldatiCount).toBe(2);
    expect(az1?.totaleUnsaldati).toBe(250.5);
  });

  it("flags hasUnsaldati false when all conti are saldati or pro forma", () => {
    const grouped = groupContiByAzienda([
      conto({ id: "c1", aziendaId: "az1", saldato: true }),
      conto({ id: "c2", aziendaId: "az1", modalita: "proforma" }),
    ]);
    expect(grouped.get("az1")?.hasUnsaldati).toBe(false);
    expect(grouped.get("az1")?.unsaldatiCount).toBe(0);
    expect(grouped.get("az1")?.totaleUnsaldati).toBe(0);
  });

  it("returns the latest emittedAt per azienda", () => {
    const grouped = groupContiByAzienda([
      conto({ id: "c1", aziendaId: "az1", emittedAt: new Date("2026-01-15T00:00:00Z") }),
      conto({ id: "c2", aziendaId: "az1", emittedAt: new Date("2026-04-22T00:00:00Z") }),
      conto({ id: "c3", aziendaId: "az1", emittedAt: new Date("2026-03-10T00:00:00Z") }),
    ]);
    expect(grouped.get("az1")?.lastEmittedAt).toEqual(
      new Date("2026-04-22T00:00:00Z")
    );
  });

  it("rounds totaleUnsaldati to two decimals", () => {
    const grouped = groupContiByAzienda([
      conto({ id: "c1", aziendaId: "az1", totaleConto: 33.333 }),
      conto({ id: "c2", aziendaId: "az1", totaleConto: 33.333 }),
      conto({ id: "c3", aziendaId: "az1", totaleConto: 33.334 }),
    ]);
    expect(grouped.get("az1")?.totaleUnsaldati).toBe(100);
  });
});
