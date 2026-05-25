import { describe, expect, it } from "vitest";
import {
  contoEmitInputSchema,
  contoSaldoInputSchema,
  contoDocSchema,
} from "../conto.js";

const validEmit = {
  aziendaId: "az1",
  periodoFrom: new Date("2026-01-01T00:00:00Z"),
  periodoTo: new Date("2026-03-31T23:59:59Z"),
  modalita: "emesso" as const,
};

describe("contoEmitInputSchema", () => {
  it("accepts a valid emit input", () => {
    expect(contoEmitInputSchema.safeParse(validEmit).success).toBe(true);
  });

  it("accepts modalita 'proforma'", () => {
    expect(
      contoEmitInputSchema.safeParse({ ...validEmit, modalita: "proforma" })
        .success
    ).toBe(true);
  });

  it("rejects unknown modalita", () => {
    expect(
      contoEmitInputSchema.safeParse({ ...validEmit, modalita: "invalid" })
        .success
    ).toBe(false);
  });

  it("rejects when periodoTo is before periodoFrom", () => {
    expect(
      contoEmitInputSchema.safeParse({
        ...validEmit,
        periodoFrom: new Date("2026-03-31"),
        periodoTo: new Date("2026-01-01"),
      }).success
    ).toBe(false);
  });

  it("rejects extra fields in strict mode", () => {
    expect(
      contoEmitInputSchema.safeParse({ ...validEmit, extra: "field" }).success
    ).toBe(false);
  });

  it("rejects missing aziendaId", () => {
    const { aziendaId: _, ...without } = validEmit;
    void _;
    expect(contoEmitInputSchema.safeParse(without).success).toBe(false);
  });
});

describe("contoSaldoInputSchema", () => {
  it("accepts a minimal saldo input", () => {
    expect(
      contoSaldoInputSchema.safeParse({ contoId: "c1" }).success
    ).toBe(true);
  });

  it("accepts an importoSaldato and metodo", () => {
    expect(
      contoSaldoInputSchema.safeParse({
        contoId: "c1",
        importoSaldato: 500,
        metodoPagamento: "bonifico",
      }).success
    ).toBe(true);
  });

  it("rejects negative importoSaldato", () => {
    expect(
      contoSaldoInputSchema.safeParse({
        contoId: "c1",
        importoSaldato: -1,
      }).success
    ).toBe(false);
  });

  it("rejects unknown metodoPagamento", () => {
    expect(
      contoSaldoInputSchema.safeParse({
        contoId: "c1",
        metodoPagamento: "carta",
      }).success
    ).toBe(false);
  });

  it("rejects note > 500 chars", () => {
    expect(
      contoSaldoInputSchema.safeParse({
        contoId: "c1",
        note: "x".repeat(501),
      }).success
    ).toBe(false);
  });
});

describe("contoDocSchema", () => {
  const now = new Date("2026-05-01T10:00:00Z");
  const baseDoc = {
    aziendaId: "az1",
    aziendaNome: "Cascina",
    periodoFrom: new Date("2026-01-01T00:00:00Z"),
    periodoTo: new Date("2026-03-31T23:59:59Z"),
    attivitaIds: ["a1", "a2", "a3"],
    totaleConto: 500,
    modalita: "emesso" as const,
    saldato: false,
    emittedAt: now,
    emittedBy: "u1",
    emittedByName: "Vet One",
    isDeleted: false,
    schemaVersion: 1 as const,
  };

  it("accepts a valid doc", () => {
    expect(contoDocSchema.safeParse(baseDoc).success).toBe(true);
  });

  it("accepts a saldato doc with saldatoBy + saldatoAt", () => {
    expect(
      contoDocSchema.safeParse({
        ...baseDoc,
        saldato: true,
        saldatoAt: now,
        saldatoBy: "u2",
        saldatoByName: "Vet Two",
        importoSaldato: 500,
        metodoPagamento: "bonifico" as const,
      }).success
    ).toBe(true);
  });

  it("rejects attivitaIds array over 10000 items", () => {
    expect(
      contoDocSchema.safeParse({
        ...baseDoc,
        attivitaIds: Array.from({ length: 10_001 }, (_, i) => `a${i}`),
      }).success
    ).toBe(false);
  });

  it("rejects totaleConto over the cap", () => {
    expect(
      contoDocSchema.safeParse({ ...baseDoc, totaleConto: 2_400_001 }).success
    ).toBe(false);
  });

  it("rejects negative totaleConto", () => {
    expect(
      contoDocSchema.safeParse({ ...baseDoc, totaleConto: -1 }).success
    ).toBe(false);
  });
});
