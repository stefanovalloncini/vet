import { describe, expect, it } from "vitest";
import type { Azienda } from "@vet/shared";
import { extractZone, groupByZone } from "../zones";

function azienda(over: Partial<Azienda> & { id: string }): Azienda {
  return {
    nome: over.nome ?? over.id,
    nomeNorm: (over.nome ?? over.id).toLowerCase(),
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: "u1",
    updatedBy: "u1",
    createdByName: "U1",
    updatedByName: "U1",
    isDeleted: false,
    schemaVersion: 1,
    ...over,
  };
}

describe("extractZone", () => {
  it("returns '—' when azienda has no indirizzo", () => {
    expect(extractZone(azienda({ id: "x" }))).toBe("—");
  });

  it("extracts the comune from a 'Via..., Comune (PR)' format", () => {
    expect(
      extractZone(azienda({ id: "x", indirizzo: "Via Roma 1, Cremona (CR)" }))
    ).toBe("Cremona");
  });

  it("extracts the comune without province", () => {
    expect(
      extractZone(azienda({ id: "x", indirizzo: "Via Garibaldi 5, Milano" }))
    ).toBe("Milano");
  });

  it("falls back to the last comma-separated part when regex does not match", () => {
    expect(
      extractZone(azienda({ id: "x", indirizzo: "12345, ZZZ" }))
    ).toBe("ZZZ");
  });

  it("returns '—' when last fallback is empty too", () => {
    expect(extractZone(azienda({ id: "x", indirizzo: ",," }))).toBe("—");
  });
});

describe("groupByZone", () => {
  it("groups multiple aziende by extracted zone", () => {
    const items = [
      azienda({ id: "a1", indirizzo: "Via X 1, Cremona (CR)" }),
      azienda({ id: "a2", indirizzo: "Via Y 2, Milano (MI)" }),
      azienda({ id: "a3", indirizzo: "Via Z 3, Cremona (CR)" }),
    ];
    const zones = groupByZone(items);
    expect(zones.find((z) => z.name === "Cremona")?.aziende).toHaveLength(2);
    expect(zones.find((z) => z.name === "Milano")?.aziende).toHaveLength(1);
  });

  it("sorts zones by count descending", () => {
    const items = [
      azienda({ id: "a1", indirizzo: "Via X, Milano" }),
      azienda({ id: "a2", indirizzo: "Via Y, Cremona" }),
      azienda({ id: "a3", indirizzo: "Via Z, Cremona" }),
      azienda({ id: "a4", indirizzo: "Via W, Cremona" }),
    ];
    const zones = groupByZone(items);
    expect(zones[0]?.name).toBe("Cremona");
    expect(zones[0]?.aziende).toHaveLength(3);
  });

  it("returns empty array for empty input", () => {
    expect(groupByZone([])).toEqual([]);
  });
});
