import { describe, expect, it } from "vitest";
import { toCsvItalian } from "../csv";
import type { Attivita } from "@vet/shared";

function makeAttivita(overrides: Partial<Attivita> = {}): Attivita {
  return {
    id: "a1",
    data: new Date("2026-03-01T09:00:00.000Z"),
    aziendaId: "az1",
    aziendaNome: "Cascina",
    tipoId: "visita",
    tipoNome: "Visita",
    oraria: false, adElemento: false,
    tariffa: 50,
    totale: 50,
    ownerUid: "u",
    ownerEmail: "u@example.com",
    ownerName: "Stefano",
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false,
    schemaVersion: 1,
    ...overrides,
  };
}

describe("toCsvItalian", () => {
  it("starts with BOM for Italian Excel", () => {
    const out = toCsvItalian([]);
    expect(out.charCodeAt(0)).toBe(0xfeff);
  });

  it("uses semicolons as separators", () => {
    const out = toCsvItalian([makeAttivita()]);
    expect(out).toContain("01/03/2026;Cascina;Visita;");
  });

  it("uses comma as decimal separator", () => {
    const out = toCsvItalian([makeAttivita({ tariffa: 50.5, totale: 50.5 })]);
    expect(out).toContain("50,50");
  });

  it("uses CRLF line endings", () => {
    const out = toCsvItalian([makeAttivita()]);
    expect(out).toContain("\r\n");
  });

  it("quotes cells with double quotes and escapes them", () => {
    const out = toCsvItalian([makeAttivita({ note: 'Ciao "amico"' })]);
    expect(out).toContain('"Ciao ""amico"""');
  });

  it("neutralizes formula prefix = (CSV injection defense)", () => {
    const out = toCsvItalian([
      makeAttivita({ ownerName: "=cmd|'/c calc'!A1" }),
    ]);
    expect(out).toContain("'=cmd");
    expect(out).not.toMatch(/;=cmd/);
  });

  it("neutralizes formula prefix +", () => {
    const out = toCsvItalian([makeAttivita({ note: "+1+1" })]);
    expect(out).toContain("'+1+1");
  });

  it("neutralizes formula prefix -", () => {
    const out = toCsvItalian([makeAttivita({ note: "-DDE(...)" })]);
    expect(out).toContain("'-DDE(...)");
  });

  it("neutralizes formula prefix @", () => {
    const out = toCsvItalian([makeAttivita({ note: "@SUM(1+1)*..." })]);
    expect(out).toContain("'@SUM");
  });

  it("neutralizes tab and CR prefix", () => {
    const out = toCsvItalian([makeAttivita({ note: "\t=cmd" })]);
    expect(out).toContain("'\t=cmd");
  });

  it("neutralizes whitespace-then-formula bypass (space + =)", () => {
    const out = toCsvItalian([makeAttivita({ note: " =cmd|'/c calc'!A1" })]);
    expect(out).toContain("' =cmd");
  });

  it("neutralizes multiple-space-then-formula bypass", () => {
    const out = toCsvItalian([makeAttivita({ note: "   +HYPERLINK('x')" })]);
    expect(out).toContain("'   +HYPERLINK");
  });

  it("neutralizes newline-then-formula bypass", () => {
    const out = toCsvItalian([makeAttivita({ note: "\n=BAD()" })]);
    expect(out).toMatch(/'[\s\S]*=BAD/);
  });

  it("leaves benign cells untouched", () => {
    const out = toCsvItalian([makeAttivita({ note: "tutto ok" })]);
    expect(out).toContain(";tutto ok");
    expect(out).not.toContain("'tutto ok");
  });
});
