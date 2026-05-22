import { describe, expect, it } from "vitest";
import { paymentInputSchema, paymentDocSchema } from "../payment.js";

describe("paymentInputSchema", () => {
  it("accepts a minimal payment", () => {
    expect(
      paymentInputSchema.safeParse({
        aziendaId: "az1",
        periodoFinoA: new Date("2026-05-31T00:00:00Z"),
      }).success
    ).toBe(true);
  });

  it("accepts a fully populated payment", () => {
    expect(
      paymentInputSchema.safeParse({
        aziendaId: "az1",
        periodoFinoA: new Date("2026-05-31T00:00:00Z"),
        importoPagato: 1500.5,
        metodoPagamento: "bonifico",
        note: "Saldo trimestre",
      }).success
    ).toBe(true);
  });

  it("rejects empty aziendaId", () => {
    expect(
      paymentInputSchema.safeParse({
        aziendaId: "",
        periodoFinoA: new Date(),
      }).success
    ).toBe(false);
  });

  it("rejects aziendaId longer than 64 chars", () => {
    expect(
      paymentInputSchema.safeParse({
        aziendaId: "x".repeat(65),
        periodoFinoA: new Date(),
      }).success
    ).toBe(false);
  });

  it("rejects negative importo", () => {
    expect(
      paymentInputSchema.safeParse({
        aziendaId: "az1",
        periodoFinoA: new Date(),
        importoPagato: -1,
      }).success
    ).toBe(false);
  });

  it("rejects importo above 1M", () => {
    expect(
      paymentInputSchema.safeParse({
        aziendaId: "az1",
        periodoFinoA: new Date(),
        importoPagato: 1_000_001,
      }).success
    ).toBe(false);
  });

  it("rejects unknown metodoPagamento", () => {
    expect(
      paymentInputSchema.safeParse({
        aziendaId: "az1",
        periodoFinoA: new Date(),
        metodoPagamento: "crypto",
      }).success
    ).toBe(false);
  });

  it("accepts each metodoPagamento value", () => {
    for (const m of ["bonifico", "contanti", "altro"] as const) {
      expect(
        paymentInputSchema.safeParse({
          aziendaId: "az1",
          periodoFinoA: new Date(),
          metodoPagamento: m,
        }).success
      ).toBe(true);
    }
  });

  it("rejects note longer than 500 chars", () => {
    expect(
      paymentInputSchema.safeParse({
        aziendaId: "az1",
        periodoFinoA: new Date(),
        note: "x".repeat(501),
      }).success
    ).toBe(false);
  });

  it("rejects extra fields in strict mode", () => {
    expect(
      paymentInputSchema.safeParse({
        aziendaId: "az1",
        periodoFinoA: new Date(),
        sneaky: true,
      }).success
    ).toBe(false);
  });
});

describe("paymentDocSchema", () => {
  const base = {
    aziendaId: "az1",
    aziendaNome: "Cascina",
    periodoFinoA: new Date("2026-05-31T00:00:00Z"),
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: "uid1",
    updatedBy: "uid1",
    createdByName: "Stefano",
    updatedByName: "Stefano",
    schemaVersion: 1 as const,
  };

  it("accepts a valid doc", () => {
    expect(paymentDocSchema.safeParse(base).success).toBe(true);
  });

  it("requires aziendaNome", () => {
    const { aziendaNome: _, ...withoutNome } = base;
    expect(paymentDocSchema.safeParse(withoutNome).success).toBe(false);
  });

  it("rejects createdByName starting with =", () => {
    expect(
      paymentDocSchema.safeParse({ ...base, createdByName: "=cmd" }).success
    ).toBe(false);
  });

  it("rejects createdBy longer than 128 chars", () => {
    expect(
      paymentDocSchema.safeParse({ ...base, createdBy: "x".repeat(129) }).success
    ).toBe(false);
  });

  it("rejects extra fields", () => {
    expect(
      paymentDocSchema.safeParse({ ...base, leak: true }).success
    ).toBe(false);
  });
});
