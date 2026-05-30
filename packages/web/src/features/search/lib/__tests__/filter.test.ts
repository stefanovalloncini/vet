import { describe, expect, it } from "vitest";
import type { Attivita, Azienda } from "@vet/shared";
import { filterAziende, filterAttivita } from "../filter";

function azienda(
  id: string,
  nome: string,
  extra: Partial<Azienda> = {}
): Azienda {
  return {
    id,
    nome,
    nomeNorm: nome.toLowerCase(),
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    createdBy: "u1",
    updatedBy: "u1",
    createdByName: "Tester",
    updatedByName: "Tester",
    isDeleted: false,
    schemaVersion: 1,
    ...extra,
  };
}

function attivita(id: string, extra: Partial<Attivita> = {}): Attivita {
  return {
    id,
    data: new Date("2026-05-01"),
    aziendaId: "az1",
    aziendaNome: "Cascina Alfa",
    tipoId: "t1",
    tipoNome: "Visita generica",
    oraria: false,
    adElemento: false,
    tariffa: 50,
    totale: 50,
    ownerUid: "u1",
    ownerEmail: "u1@example.com",
    ownerName: "Owner",
    createdAt: new Date("2026-05-01"),
    updatedAt: new Date("2026-05-01"),
    isDeleted: false,
    schemaVersion: 1,
    ...extra,
  };
}

describe("filterAziende", () => {
  const items = [
    azienda("a1", "Cascina Alfa", { telefono: "3331234567" }),
    azienda("a2", "Allevamento Beta"),
    azienda("a3", "Caffè Gamma"),
  ];

  it("returns the first few as suggestions for an empty or whitespace query", () => {
    expect(filterAziende(items, "").map((a) => a.id)).toEqual(["a1", "a2", "a3"]);
    expect(filterAziende(items, "   ").map((a) => a.id)).toEqual([
      "a1",
      "a2",
      "a3",
    ]);
  });

  it("matches by name, normalized name, and phone", () => {
    expect(filterAziende(items, "cascina").map((a) => a.id)).toEqual(["a1"]);
    expect(filterAziende(items, "BETA").map((a) => a.id)).toEqual(["a2"]);
    expect(filterAziende(items, "333").map((a) => a.id)).toEqual(["a1"]);
  });

  it("matches an accented query via the raw name", () => {
    expect(filterAziende(items, "caffè").map((a) => a.id)).toEqual(["a3"]);
  });

  it("ignores leading/trailing whitespace in the query", () => {
    expect(filterAziende(items, "  Alfa  ").map((a) => a.id)).toEqual(["a1"]);
  });

  it("returns nothing when there is no match", () => {
    expect(filterAziende(items, "zzz")).toEqual([]);
  });

  it("caps matches at 8", () => {
    const many = Array.from({ length: 20 }, (_, i) => azienda(`x${i}`, `Match ${i}`));
    expect(filterAziende(many, "match")).toHaveLength(8);
  });
});

describe("filterAttivita", () => {
  const items = [
    attivita("at1", { aziendaNome: "Cascina Alfa", tipoNome: "Visita" }),
    attivita("at2", { aziendaNome: "Beta", tipoNome: "Dosaggio", note: "urgente" }),
  ];

  it("returns nothing for an empty or whitespace query", () => {
    expect(filterAttivita(items, "")).toEqual([]);
    expect(filterAttivita(items, "   ")).toEqual([]);
  });

  it("matches by azienda name, tipo, and note", () => {
    expect(filterAttivita(items, "cascina").map((a) => a.id)).toEqual(["at1"]);
    expect(filterAttivita(items, "dosaggio").map((a) => a.id)).toEqual(["at2"]);
    expect(filterAttivita(items, "urgente").map((a) => a.id)).toEqual(["at2"]);
  });

  it("ignores surrounding whitespace", () => {
    expect(filterAttivita(items, "  beta ").map((a) => a.id)).toEqual(["at2"]);
  });
});
