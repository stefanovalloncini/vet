import { describe, expect, it } from "vitest";
import type { Attivita } from "@vet/shared";
import { computeCombos } from "../recentCombos";

function make(overrides: Partial<Attivita> = {}): Attivita {
  return {
    id: "id",
    data: new Date("2026-01-01"),
    aziendaId: "az1",
    aziendaNome: "Bianchi",
    tipoId: "tp1",
    tipoNome: "Visita",
    oraria: false, adElemento: false,
    tariffa: 40,
    totale: 40,
    ownerUid: "u1",
    ownerEmail: "",
    ownerName: "",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    isDeleted: false,
    schemaVersion: 1,
    ...overrides,
  };
}

describe("computeCombos", () => {
  it("returns empty arrays when there are no entries", () => {
    const { recents, frequents } = computeCombos([]);
    expect(recents).toEqual([]);
    expect(frequents).toEqual([]);
  });

  it("dedups by aziendaId+tipoId and keeps the most recent tariffa", () => {
    const items = [
      make({
        id: "old",
        aziendaId: "az1",
        tipoId: "tp1",
        tariffa: 30,
        data: new Date("2026-01-01"),
      }),
      make({
        id: "new",
        aziendaId: "az1",
        tipoId: "tp1",
        tariffa: 45,
        data: new Date("2026-02-01"),
      }),
    ];
    const { recents } = computeCombos(items);
    expect(recents).toHaveLength(1);
    expect(recents[0]).toMatchObject({
      aziendaId: "az1",
      tipoId: "tp1",
      tariffa: 45,
    });
  });

  it("sorts recents by most recent occurrence", () => {
    const items = [
      make({
        aziendaId: "az2",
        tipoId: "tp1",
        data: new Date("2026-01-10"),
      }),
      make({
        aziendaId: "az1",
        tipoId: "tp1",
        data: new Date("2026-01-20"),
      }),
      make({
        aziendaId: "az3",
        tipoId: "tp1",
        data: new Date("2026-01-15"),
      }),
    ];
    const { recents } = computeCombos(items);
    expect(recents.map((c) => c.aziendaId)).toEqual(["az1", "az3", "az2"]);
  });

  it("caps recents at the limit", () => {
    const items = Array.from({ length: 10 }).map((_, i) =>
      make({
        aziendaId: `az${i}`,
        tipoId: "tp1",
        data: new Date(2026, 0, i + 1),
      })
    );
    const { recents } = computeCombos(items, { limit: 5 });
    expect(recents).toHaveLength(5);
  });

  it("defaults the limit to 5", () => {
    const items = Array.from({ length: 10 }).map((_, i) =>
      make({
        aziendaId: `az${i}`,
        tipoId: "tp1",
        data: new Date(2026, 0, i + 1),
      })
    );
    const { recents } = computeCombos(items);
    expect(recents).toHaveLength(5);
  });

  it("ranks frequents by usage count desc", () => {
    const items = [
      make({ aziendaId: "az1", tipoId: "tp1" }),
      make({ aziendaId: "az1", tipoId: "tp1" }),
      make({ aziendaId: "az1", tipoId: "tp1" }),
      make({ aziendaId: "az2", tipoId: "tp2" }),
      make({ aziendaId: "az2", tipoId: "tp2" }),
      make({ aziendaId: "az3", tipoId: "tp3" }),
    ];
    const { frequents } = computeCombos(items);
    expect(frequents.map((c) => c.aziendaId)).toEqual(["az1", "az2", "az3"]);
    expect(frequents.map((c) => c.count)).toEqual([3, 2, 1]);
  });

  it("breaks frequency ties by most recent occurrence", () => {
    const items = [
      make({
        aziendaId: "az1",
        tipoId: "tp1",
        data: new Date("2026-01-01"),
      }),
      make({
        aziendaId: "az2",
        tipoId: "tp2",
        data: new Date("2026-02-01"),
      }),
    ];
    const { frequents } = computeCombos(items);
    expect(frequents.map((c) => c.aziendaId)).toEqual(["az2", "az1"]);
  });

  it("ignores soft-deleted entries", () => {
    const items = [
      make({ aziendaId: "az1", tipoId: "tp1", isDeleted: true }),
      make({ aziendaId: "az2", tipoId: "tp2" }),
    ];
    const { recents, frequents } = computeCombos(items);
    expect(recents.map((c) => c.aziendaId)).toEqual(["az2"]);
    expect(frequents.map((c) => c.aziendaId)).toEqual(["az2"]);
  });

  it("ignores hourly entries since the dialog only creates non-hourly", () => {
    const items = [
      make({ aziendaId: "az1", tipoId: "tp1", oraria: true }),
      make({ aziendaId: "az2", tipoId: "tp2", oraria: false }),
    ];
    const { recents, frequents } = computeCombos(items);
    expect(recents.map((c) => c.aziendaId)).toEqual(["az2"]);
    expect(frequents.map((c) => c.aziendaId)).toEqual(["az2"]);
  });

  it("uses the most recent aziendaNome and tipoNome on each combo", () => {
    const items = [
      make({
        aziendaId: "az1",
        tipoId: "tp1",
        aziendaNome: "Old",
        tipoNome: "Old",
        data: new Date("2026-01-01"),
      }),
      make({
        aziendaId: "az1",
        tipoId: "tp1",
        aziendaNome: "New",
        tipoNome: "New",
        data: new Date("2026-02-01"),
      }),
    ];
    const { recents } = computeCombos(items);
    expect(recents[0]).toMatchObject({ aziendaNome: "New", tipoNome: "New" });
  });

  it("exposes the lastUsed date for each combo", () => {
    const items = [
      make({
        aziendaId: "az1",
        tipoId: "tp1",
        data: new Date("2026-01-01"),
      }),
      make({
        aziendaId: "az1",
        tipoId: "tp1",
        data: new Date("2026-02-01"),
      }),
    ];
    const { recents } = computeCombos(items);
    expect(recents[0]?.lastUsed).toEqual(new Date("2026-02-01"));
  });
});
