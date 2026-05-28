import { describe, expect, it } from "vitest";
import { makeAttivita as att } from "@vet/shared/testing";
import { computeTotals, groupAttivita } from "../totals";

describe("computeTotals", () => {
  it("counts items and sums totale", () => {
    const r = computeTotals([
      att({ id: "1", totale: 100 }),
      att({ id: "2", totale: 200 }),
    ]);
    expect(r.count).toBe(2);
    expect(r.totale).toBe(300);
  });

  it("counts distinct aziende and vets", () => {
    const r = computeTotals([
      att({ id: "1", aziendaId: "a1", ownerUid: "u1" }),
      att({ id: "2", aziendaId: "a1", ownerUid: "u2" }),
      att({ id: "3", aziendaId: "a2", ownerUid: "u1" }),
    ]);
    expect(r.aziende).toBe(2);
    expect(r.vets).toBe(2);
  });

  it("returns all zeros for empty array", () => {
    expect(computeTotals([])).toEqual({
      count: 0,
      totale: 0,
      aziende: 0,
      vets: 0,
    });
  });

  it("rounds totale to two decimals", () => {
    const r = computeTotals([
      att({ id: "1", totale: 33.333 }),
      att({ id: "2", totale: 33.333 }),
      att({ id: "3", totale: 33.334 }),
    ]);
    expect(r.totale).toBe(100);
  });
});

describe("groupAttivita", () => {
  it("returns a single 'all' group when by='none'", () => {
    const r = groupAttivita(
      [att({ id: "1", totale: 100 }), att({ id: "2", totale: 50 })],
      "none"
    );
    expect(r).toHaveLength(1);
    expect(r[0]?.key).toBe("all");
    expect(r[0]?.totale).toBe(150);
  });

  it("groups by azienda using aziendaId as key and aziendaNome as label", () => {
    const r = groupAttivita(
      [
        att({ id: "1", aziendaId: "a1", aziendaNome: "Uno", totale: 100 }),
        att({ id: "2", aziendaId: "a2", aziendaNome: "Due", totale: 50 }),
        att({ id: "3", aziendaId: "a1", aziendaNome: "Uno", totale: 20 }),
      ],
      "azienda"
    );
    const a1 = r.find((g) => g.key === "a1");
    expect(a1?.label).toBe("Uno");
    expect(a1?.totale).toBe(120);
    expect(r.find((g) => g.key === "a2")?.totale).toBe(50);
  });

  it("groups by vet using ownerUid as key", () => {
    const r = groupAttivita(
      [
        att({ id: "1", ownerUid: "u1", ownerName: "Vet1", totale: 30 }),
        att({ id: "2", ownerUid: "u2", ownerName: "Vet2", totale: 70 }),
      ],
      "vet"
    );
    expect(r.find((g) => g.key === "u1")?.totale).toBe(30);
    expect(r.find((g) => g.key === "u2")?.label).toBe("Vet2");
  });

  it("groups by giorno using YYYY-MM-DD as key", () => {
    const r = groupAttivita(
      [
        att({ id: "1", data: new Date(2026, 4, 15), totale: 50 }),
        att({ id: "2", data: new Date(2026, 4, 15), totale: 25 }),
        att({ id: "3", data: new Date(2026, 4, 16), totale: 30 }),
      ],
      "giorno"
    );
    expect(r.find((g) => g.key === "2026-05-15")?.totale).toBe(75);
    expect(r.find((g) => g.key === "2026-05-16")?.totale).toBe(30);
  });

  it("returns an empty group only when items are empty (none)", () => {
    const r = groupAttivita([], "none");
    expect(r[0]?.items).toEqual([]);
    expect(r[0]?.totale).toBe(0);
  });

  it("returns empty array when by != none and items are empty", () => {
    expect(groupAttivita([], "azienda")).toEqual([]);
  });
});
