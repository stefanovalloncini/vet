import { describe, expect, it } from "vitest";
import {
  aziendaInputSchema,
  aziendaDocSchema,
  normalizeAziendaNome,
  isValidPartitaIva,
} from "../azienda.js";

describe("aziendaInputSchema", () => {
  it("accepts a minimal valid input", () => {
    const r = aziendaInputSchema.safeParse({ nome: "Cascina San Marco" });
    expect(r.success).toBe(true);
  });

  it("accepts a fully populated input", () => {
    const r = aziendaInputSchema.safeParse({
      nome: "Cascina San Marco",
      indirizzo: "Via Roma 1, 20100 Milano",
      piva: "12345678903",
      emailFatturazione: "admin@cascina.it",
      cadenzaFatturazione: "quarterly",
      note: "Pagamento via bonifico",
    });
    expect(r.success).toBe(true);
  });

  it("rejects empty nome", () => {
    expect(aziendaInputSchema.safeParse({ nome: "" }).success).toBe(false);
  });

  it("rejects nome longer than 200 chars", () => {
    expect(
      aziendaInputSchema.safeParse({ nome: "x".repeat(201) }).success
    ).toBe(false);
  });

  it("trims and accepts surrounding whitespace in nome", () => {
    const r = aziendaInputSchema.safeParse({ nome: "  Cascina  " });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.nome).toBe("Cascina");
  });

  it("rejects nome that is whitespace only", () => {
    expect(aziendaInputSchema.safeParse({ nome: "   " }).success).toBe(false);
  });

  it("rejects indirizzo longer than 300 chars", () => {
    expect(
      aziendaInputSchema.safeParse({
        nome: "x",
        indirizzo: "x".repeat(301),
      }).success
    ).toBe(false);
  });

  it("rejects note longer than 1000 chars", () => {
    expect(
      aziendaInputSchema.safeParse({
        nome: "x",
        note: "x".repeat(1001),
      }).success
    ).toBe(false);
  });

  it("rejects invalid emailFatturazione", () => {
    expect(
      aziendaInputSchema.safeParse({
        nome: "x",
        emailFatturazione: "not-an-email",
      }).success
    ).toBe(false);
  });

  it("rejects invalid cadenzaFatturazione values", () => {
    expect(
      aziendaInputSchema.safeParse({
        nome: "x",
        cadenzaFatturazione: "weekly",
      }).success
    ).toBe(false);
  });

  it("accepts each cadenzaFatturazione value", () => {
    for (const c of ["monthly", "quarterly", "semiannual"] as const) {
      const r = aziendaInputSchema.safeParse({
        nome: "x",
        cadenzaFatturazione: c,
      });
      expect(r.success).toBe(true);
    }
  });

  it("rejects piva that is not 11 digits", () => {
    expect(
      aziendaInputSchema.safeParse({ nome: "x", piva: "1234567890" }).success
    ).toBe(false);
    expect(
      aziendaInputSchema.safeParse({ nome: "x", piva: "abcdefghijk" }).success
    ).toBe(false);
  });

  it("rejects piva with invalid checksum", () => {
    expect(
      aziendaInputSchema.safeParse({ nome: "x", piva: "12345678900" }).success
    ).toBe(false);
  });

  it("accepts piva with valid checksum", () => {
    expect(
      aziendaInputSchema.safeParse({ nome: "x", piva: "12345678903" }).success
    ).toBe(true);
  });

  it("strips optional IT prefix from piva", () => {
    const r = aziendaInputSchema.safeParse({
      nome: "x",
      piva: "IT12345678903",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.piva).toBe("12345678903");
  });

  it("accepts a positive armadiettoCanoneAnnuo", () => {
    expect(
      aziendaInputSchema.safeParse({ nome: "x", armadiettoCanoneAnnuo: 800 })
        .success
    ).toBe(true);
  });

  it("accepts armadiettoCanoneAnnuo with two decimals", () => {
    expect(
      aziendaInputSchema.safeParse({ nome: "x", armadiettoCanoneAnnuo: 800.5 })
        .success
    ).toBe(true);
  });

  it("rejects zero or negative armadiettoCanoneAnnuo", () => {
    expect(
      aziendaInputSchema.safeParse({ nome: "x", armadiettoCanoneAnnuo: 0 })
        .success
    ).toBe(false);
    expect(
      aziendaInputSchema.safeParse({ nome: "x", armadiettoCanoneAnnuo: -100 })
        .success
    ).toBe(false);
  });

  it("rejects armadiettoCanoneAnnuo over the cap", () => {
    expect(
      aziendaInputSchema.safeParse({ nome: "x", armadiettoCanoneAnnuo: 100_001 })
        .success
    ).toBe(false);
  });

  it("rejects armadiettoCanoneAnnuo with more than two decimals", () => {
    expect(
      aziendaInputSchema.safeParse({ nome: "x", armadiettoCanoneAnnuo: 80.123 })
        .success
    ).toBe(false);
  });

  it("rejects extra fields in strict mode", () => {
    expect(
      aziendaInputSchema.safeParse({ nome: "x", sneaky: 1 }).success
    ).toBe(false);
  });
});

describe("aziendaDocSchema", () => {
  it("accepts a valid doc", () => {
    const now = new Date();
    const r = aziendaDocSchema.safeParse({
      nome: "Cascina",
      nomeNorm: "cascina",
      indirizzo: "Via Roma 1",
      piva: "12345678903",
      emailFatturazione: "x@y.it",
      cadenzaFatturazione: "monthly",
      note: "n",
      createdAt: now,
      updatedAt: now,
      createdBy: "uid1",
      updatedBy: "uid1",
      createdByName: "Stefano",
      updatedByName: "Stefano",
      isDeleted: false,
      schemaVersion: 1,
    });
    expect(r.success).toBe(true);
  });

  it("accepts a doc with armadiettoCanoneAnnuo", () => {
    const now = new Date();
    const r = aziendaDocSchema.safeParse({
      nome: "Cascina",
      nomeNorm: "cascina",
      armadiettoCanoneAnnuo: 800,
      createdAt: now,
      updatedAt: now,
      createdBy: "uid1",
      updatedBy: "uid1",
      createdByName: "Stefano",
      updatedByName: "Stefano",
      isDeleted: false,
      schemaVersion: 1,
    });
    expect(r.success).toBe(true);
  });

  it("requires audit fields", () => {
    const r = aziendaDocSchema.safeParse({
      nome: "x",
      nomeNorm: "x",
      isDeleted: false,
      schemaVersion: 1,
    });
    expect(r.success).toBe(false);
  });
});

describe("normalizeAziendaNome", () => {
  it("lowercases and trims", () => {
    expect(normalizeAziendaNome("  Cascina San Marco  ")).toBe(
      "cascina san marco"
    );
  });

  it("collapses inner whitespace", () => {
    expect(normalizeAziendaNome("Cascina   San   Marco")).toBe(
      "cascina san marco"
    );
  });

  it("folds case sensitively (a vs A is same)", () => {
    expect(normalizeAziendaNome("ABC")).toBe(normalizeAziendaNome("abc"));
  });
});

describe("isValidPartitaIva", () => {
  it("accepts known-good P.IVA", () => {
    expect(isValidPartitaIva("12345678903")).toBe(true);
  });

  it("rejects all-zeros", () => {
    expect(isValidPartitaIva("00000000000")).toBe(false);
  });

  it("rejects wrong length", () => {
    expect(isValidPartitaIva("123")).toBe(false);
    expect(isValidPartitaIva("123456789012")).toBe(false);
  });

  it("rejects non-numeric input", () => {
    expect(isValidPartitaIva("abcdefghijk")).toBe(false);
  });
});
