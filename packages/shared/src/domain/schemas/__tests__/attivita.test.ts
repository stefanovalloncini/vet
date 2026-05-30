import { describe, expect, it } from "vitest";
import {
  attivitaInputSchema,
  attivitaDocSchema,
  computeTotale,
} from "../attivita.js";

const baseInput = {
  data: new Date("2026-03-01T09:00:00.000Z"),
  aziendaId: "az1",
  tipoId: "visita",
  oraria: false,
  adElemento: false,
  tariffa: 50,
};

describe("attivitaInputSchema", () => {
  it("accepts a non-hourly minimal input", () => {
    const r = attivitaInputSchema.safeParse(baseInput);
    expect(r.success).toBe(true);
  });

  it("accepts an hourly input with ore", () => {
    const r = attivitaInputSchema.safeParse({
      ...baseInput,
      oraria: true,
      tariffa: 30,
      ore: 2.5,
    });
    expect(r.success).toBe(true);
  });

  it("rejects hourly input without ore", () => {
    const r = attivitaInputSchema.safeParse({ ...baseInput, oraria: true });
    expect(r.success).toBe(false);
  });

  it("rejects ore on non-hourly input", () => {
    const r = attivitaInputSchema.safeParse({
      ...baseInput,
      oraria: false,
      ore: 1,
    });
    expect(r.success).toBe(false);
  });

  it("rejects negative tariffa", () => {
    expect(
      attivitaInputSchema.safeParse({ ...baseInput, tariffa: -1 }).success
    ).toBe(false);
  });

  it("rejects zero tariffa", () => {
    expect(
      attivitaInputSchema.safeParse({ ...baseInput, tariffa: 0 }).success
    ).toBe(false);
  });

  it("rejects tariffa over 100k", () => {
    expect(
      attivitaInputSchema.safeParse({ ...baseInput, tariffa: 100_001 }).success
    ).toBe(false);
  });

  it("rejects tariffa with > 2 decimals", () => {
    expect(
      attivitaInputSchema.safeParse({ ...baseInput, tariffa: 50.123 }).success
    ).toBe(false);
  });

  it("accepts tariffa with 2 decimals", () => {
    expect(
      attivitaInputSchema.safeParse({ ...baseInput, tariffa: 50.5 }).success
    ).toBe(true);
    expect(
      attivitaInputSchema.safeParse({ ...baseInput, tariffa: 50.55 }).success
    ).toBe(true);
    // float-fragile 2-decimal values (19.99*100 !== 1999 exactly) must still pass
    for (const tariffa of [19.99, 0.07, 8.55, 70.1]) {
      expect(
        attivitaInputSchema.safeParse({ ...baseInput, tariffa }).success
      ).toBe(true);
    }
  });

  it("rejects ore > 24 when oraria", () => {
    expect(
      attivitaInputSchema.safeParse({
        ...baseInput,
        oraria: true,
        ore: 25,
      }).success
    ).toBe(false);
  });

  it("rejects ore <= 0 when oraria", () => {
    expect(
      attivitaInputSchema.safeParse({
        ...baseInput,
        oraria: true,
        ore: 0,
      }).success
    ).toBe(false);
  });

  it("rejects empty aziendaId", () => {
    expect(
      attivitaInputSchema.safeParse({ ...baseInput, aziendaId: "" }).success
    ).toBe(false);
  });

  it("rejects empty tipoId", () => {
    expect(
      attivitaInputSchema.safeParse({ ...baseInput, tipoId: "" }).success
    ).toBe(false);
  });

  it("rejects note longer than 2000 chars", () => {
    expect(
      attivitaInputSchema.safeParse({
        ...baseInput,
        note: "x".repeat(2001),
      }).success
    ).toBe(false);
  });

  it("accepts note up to 2000 chars", () => {
    expect(
      attivitaInputSchema.safeParse({
        ...baseInput,
        note: "x".repeat(2000),
      }).success
    ).toBe(true);
  });

  it("rejects extra fields in strict mode", () => {
    expect(
      attivitaInputSchema.safeParse({ ...baseInput, sneaky: 1 }).success
    ).toBe(false);
  });

  it("rejects tipoId 'altro' without a note", () => {
    expect(
      attivitaInputSchema.safeParse({ ...baseInput, tipoId: "altro" }).success
    ).toBe(false);
  });

  it("rejects tipoId 'altro' with whitespace-only note", () => {
    expect(
      attivitaInputSchema.safeParse({
        ...baseInput,
        tipoId: "altro",
        note: "   ",
      }).success
    ).toBe(false);
  });

  it("accepts tipoId 'altro' when a non-empty note is present", () => {
    expect(
      attivitaInputSchema.safeParse({
        ...baseInput,
        tipoId: "altro",
        note: "Visita straordinaria notturna",
      }).success
    ).toBe(true);
  });

  it("accepts adElemento input with elementi", () => {
    const r = attivitaInputSchema.safeParse({
      ...baseInput,
      adElemento: true,
      tariffa: 2,
      elementi: 15,
    });
    expect(r.success).toBe(true);
  });

  it("rejects adElemento input without elementi", () => {
    expect(
      attivitaInputSchema.safeParse({
        ...baseInput,
        adElemento: true,
      }).success
    ).toBe(false);
  });

  it("rejects elementi when adElemento is false", () => {
    expect(
      attivitaInputSchema.safeParse({
        ...baseInput,
        adElemento: false,
        elementi: 5,
      }).success
    ).toBe(false);
  });

  it("rejects when both oraria and adElemento are true", () => {
    expect(
      attivitaInputSchema.safeParse({
        ...baseInput,
        oraria: true,
        ore: 2,
        adElemento: true,
        elementi: 10,
      }).success
    ).toBe(false);
  });

  it("rejects non-integer elementi", () => {
    expect(
      attivitaInputSchema.safeParse({
        ...baseInput,
        adElemento: true,
        elementi: 2.5,
      }).success
    ).toBe(false);
  });

  it("rejects elementi above the 10000 cap", () => {
    expect(
      attivitaInputSchema.safeParse({
        ...baseInput,
        adElemento: true,
        elementi: 10001,
      }).success
    ).toBe(false);
  });
});

describe("computeTotale modalita", () => {
  it("multiplies tariffa by elementi for adElemento", () => {
    expect(
      computeTotale({
        oraria: false,
        adElemento: true,
        tariffa: 2,
        elementi: 15,
      })
    ).toBe(30);
  });

  it("falls back to tariffa when adElemento is true but elementi is missing", () => {
    expect(
      computeTotale({ oraria: false, adElemento: true, tariffa: 50 })
    ).toBe(50);
  });

  it("prefers oraria over adElemento when both are set", () => {
    expect(
      computeTotale({
        oraria: true,
        adElemento: true,
        tariffa: 10,
        ore: 3,
        elementi: 5,
      })
    ).toBe(30);
  });
});

describe("computeTotale", () => {
  it("returns tariffa for non-hourly", () => {
    expect(computeTotale({ oraria: false, tariffa: 50 })).toBe(50);
  });

  it("returns tariffa * ore for hourly", () => {
    expect(computeTotale({ oraria: true, tariffa: 30, ore: 2.5 })).toBe(75);
  });

  it("rounds to 2 decimals", () => {
    expect(computeTotale({ oraria: true, tariffa: 33.33, ore: 3 })).toBe(99.99);
  });

  it("handles floating point cleanly", () => {
    expect(computeTotale({ oraria: true, tariffa: 0.1, ore: 0.2 })).toBe(0.02);
  });
});

describe("attivitaDocSchema", () => {
  it("accepts a complete doc", () => {
    const now = new Date();
    const r = attivitaDocSchema.safeParse({
      data: now,
      aziendaId: "az1",
      aziendaNome: "Cascina",
      tipoId: "visita",
      tipoNome: "Visita",
      oraria: false,
      tariffa: 50,
      totale: 50,
      ownerUid: "uid",
      ownerEmail: "u@e.com",
      ownerName: "U",
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
      schemaVersion: 1,
    });
    expect(r.success).toBe(true);
  });

  it("requires denorm names", () => {
    const now = new Date();
    expect(
      attivitaDocSchema.safeParse({
        data: now,
        aziendaId: "az1",
        tipoId: "visita",
        oraria: false,
        tariffa: 50,
        totale: 50,
        ownerUid: "uid",
        ownerEmail: "u@e.com",
        ownerName: "U",
        createdAt: now,
        updatedAt: now,
        isDeleted: false,
        schemaVersion: 1,
      }).success
    ).toBe(false);
  });
});
