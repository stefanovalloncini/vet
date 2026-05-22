import { describe, expect, it } from "vitest";
import type { ActivityType, Attivita } from "@vet/shared";
import { GINECOLOGIA_TIPO_ID } from "@vet/shared";
import {
  defaultTariffaForTipo,
  hasDuplicateAttivita,
  parseTariffa,
} from "../quickEntryHelpers";

function tipo(
  over: Partial<ActivityType> & Pick<ActivityType, "id" | "nome">
): ActivityType {
  return {
    ordine: 0,
    attivo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    schemaVersion: 1,
    ...over,
  } as ActivityType;
}

function attivita(
  over: Partial<Attivita> & Pick<Attivita, "aziendaId" | "tipoId" | "data">
): Attivita {
  return {
    id: "att-1",
    aziendaNome: "Az",
    tipoNome: "T",
    oraria: false,
    tariffa: 30,
    totale: 30,
    ownerUid: "u",
    ownerEmail: "e@example.com",
    ownerName: "n",
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false,
    schemaVersion: 1,
    ...over,
  } as Attivita;
}

describe("defaultTariffaForTipo", () => {
  const tipi: ActivityType[] = [
    tipo({ id: "visita", nome: "Visita", tariffaStandard: 30 }),
    tipo({ id: "altro", nome: "Altro" }),
  ];

  it("returns null when tipoId is empty", () => {
    expect(defaultTariffaForTipo("", tipi)).toBeNull();
  });

  it("returns null for the ginecologia tipo (async handled elsewhere)", () => {
    expect(defaultTariffaForTipo(GINECOLOGIA_TIPO_ID, tipi)).toBeNull();
  });

  it("returns the standard tariffa as a string when present", () => {
    expect(defaultTariffaForTipo("visita", tipi)).toBe("30");
  });

  it("returns null when the tipo has no standard tariffa", () => {
    expect(defaultTariffaForTipo("altro", tipi)).toBeNull();
  });

  it("returns null when the tipo is unknown", () => {
    expect(defaultTariffaForTipo("zzz", tipi)).toBeNull();
  });
});

describe("hasDuplicateAttivita", () => {
  const date = new Date(2026, 4, 15);

  it("returns false when aziendaId is empty", () => {
    expect(
      hasDuplicateAttivita({
        items: [attivita({ aziendaId: "a", tipoId: "t", data: date })],
        aziendaId: "",
        tipoId: "t",
        date,
      })
    ).toBe(false);
  });

  it("returns false when tipoId is empty", () => {
    expect(
      hasDuplicateAttivita({
        items: [attivita({ aziendaId: "a", tipoId: "t", data: date })],
        aziendaId: "a",
        tipoId: "",
        date,
      })
    ).toBe(false);
  });

  it("returns true when same azienda, tipo, and date already exists", () => {
    expect(
      hasDuplicateAttivita({
        items: [attivita({ aziendaId: "a", tipoId: "t", data: date })],
        aziendaId: "a",
        tipoId: "t",
        date: new Date(2026, 4, 15),
      })
    ).toBe(true);
  });

  it("returns false on a different day even with same azienda and tipo", () => {
    expect(
      hasDuplicateAttivita({
        items: [attivita({ aziendaId: "a", tipoId: "t", data: date })],
        aziendaId: "a",
        tipoId: "t",
        date: new Date(2026, 4, 16),
      })
    ).toBe(false);
  });

  it("returns false on a different azienda", () => {
    expect(
      hasDuplicateAttivita({
        items: [attivita({ aziendaId: "a", tipoId: "t", data: date })],
        aziendaId: "b",
        tipoId: "t",
        date,
      })
    ).toBe(false);
  });

  it("returns false on a different tipo", () => {
    expect(
      hasDuplicateAttivita({
        items: [attivita({ aziendaId: "a", tipoId: "t", data: date })],
        aziendaId: "a",
        tipoId: "u",
        date,
      })
    ).toBe(false);
  });

  it("returns false for empty items list", () => {
    expect(
      hasDuplicateAttivita({
        items: [],
        aziendaId: "a",
        tipoId: "t",
        date,
      })
    ).toBe(false);
  });
});

describe("parseTariffa", () => {
  it("returns null for empty string", () => {
    expect(parseTariffa("")).toBeNull();
  });

  it("returns null for whitespace-only string", () => {
    expect(parseTariffa("   ")).toBeNull();
  });

  it("parses a numeric string to a number", () => {
    expect(parseTariffa("42")).toBe(42);
  });

  it("parses a decimal string to a number", () => {
    expect(parseTariffa("12.50")).toBe(12.5);
  });

  it("trims surrounding whitespace before parsing", () => {
    expect(parseTariffa("  30  ")).toBe(30);
  });

  it("returns null for non-numeric strings", () => {
    expect(parseTariffa("abc")).toBeNull();
  });
});
