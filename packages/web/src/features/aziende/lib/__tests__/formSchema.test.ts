import { describe, expect, it } from "vitest";
import type { Azienda } from "@vet/shared";
import {
  aziendaFormSchema,
  emptyAziendaForm,
  formFromAzienda,
  formToAziendaInput,
} from "../formSchema";

function fullAzienda(over: Partial<Azienda> = {}): Azienda {
  return {
    id: "az1",
    nome: "Cascina Verdi",
    nomeNorm: "cascina verdi",
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

describe("aziendaFormSchema", () => {
  it("requires nome", () => {
    const r = aziendaFormSchema.safeParse({ ...emptyAziendaForm, nome: "" });
    expect(r.success).toBe(false);
  });

  it("trims nome before validating", () => {
    const r = aziendaFormSchema.safeParse({
      ...emptyAziendaForm,
      nome: "   Test   ",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.nome).toBe("Test");
  });

  it("accepts empty piva but rejects invalid one", () => {
    const valid = aziendaFormSchema.safeParse({
      ...emptyAziendaForm,
      nome: "X",
      piva: "",
    });
    expect(valid.success).toBe(true);
    const invalid = aziendaFormSchema.safeParse({
      ...emptyAziendaForm,
      nome: "X",
      piva: "12345",
    });
    expect(invalid.success).toBe(false);
  });

  it("accepts empty email but rejects invalid one", () => {
    const valid = aziendaFormSchema.safeParse({
      ...emptyAziendaForm,
      nome: "X",
      emailFatturazione: "",
    });
    expect(valid.success).toBe(true);
    const invalid = aziendaFormSchema.safeParse({
      ...emptyAziendaForm,
      nome: "X",
      emailFatturazione: "not-an-email",
    });
    expect(invalid.success).toBe(false);
  });

  it("rejects numeroCapi outside 0-100000", () => {
    const negative = aziendaFormSchema.safeParse({
      ...emptyAziendaForm,
      nome: "X",
      numeroCapi: "-1",
    });
    expect(negative.success).toBe(false);
    const tooBig = aziendaFormSchema.safeParse({
      ...emptyAziendaForm,
      nome: "X",
      numeroCapi: "200000",
    });
    expect(tooBig.success).toBe(false);
  });

  it("accepts cadenza enum values", () => {
    const r = aziendaFormSchema.safeParse({
      ...emptyAziendaForm,
      nome: "X",
      cadenzaFatturazione: "quarterly",
    });
    expect(r.success).toBe(true);
  });

  it("accepts empty or valid armadiettoCanoneAnnuo, rejects invalid", () => {
    const ok = (v: string) =>
      aziendaFormSchema.safeParse({
        ...emptyAziendaForm,
        nome: "X",
        armadiettoCanoneAnnuo: v,
      }).success;
    expect(ok("")).toBe(true);
    expect(ok("800")).toBe(true);
    expect(ok("800.50")).toBe(true);
    // float-fragile 2-decimal values (70.1*100 !== 7010 exactly) must pass
    expect(ok("70.10")).toBe(true);
    expect(ok("19.99")).toBe(true);
    expect(ok("-5")).toBe(false);
    expect(ok("0")).toBe(false);
    expect(ok("200000")).toBe(false);
    expect(ok("80.123")).toBe(false);
    expect(ok("abc")).toBe(false);
  });
});

describe("formFromAzienda", () => {
  it("converts undefined optionals to empty strings", () => {
    const r = formFromAzienda(fullAzienda());
    expect(r.nome).toBe("Cascina Verdi");
    expect(r.indirizzo).toBe("");
    expect(r.numeroCapi).toBe("");
    expect(r.cadenzaFatturazione).toBe("");
  });

  it("stringifies numeroCapi when present", () => {
    const r = formFromAzienda(fullAzienda({ numeroCapi: 42 }));
    expect(r.numeroCapi).toBe("42");
  });

  it("stringifies armadiettoCanoneAnnuo when present, empty otherwise", () => {
    expect(
      formFromAzienda(fullAzienda({ armadiettoCanoneAnnuo: 800 }))
        .armadiettoCanoneAnnuo
    ).toBe("800");
    expect(formFromAzienda(fullAzienda()).armadiettoCanoneAnnuo).toBe("");
  });
});

describe("formToAziendaInput", () => {
  it("omits empty optional fields", () => {
    const r = formToAziendaInput({ ...emptyAziendaForm, nome: "X" });
    expect(r.nome).toBe("X");
    expect("indirizzo" in r).toBe(false);
    expect("piva" in r).toBe(false);
    expect("numeroCapi" in r).toBe(false);
  });

  it("strips 'IT' prefix from piva", () => {
    const r = formToAziendaInput({
      ...emptyAziendaForm,
      nome: "X",
      piva: "IT12345678901",
    });
    expect(r.piva).toBe("12345678901");
  });

  it("converts numeroCapi to a number", () => {
    const r = formToAziendaInput({
      ...emptyAziendaForm,
      nome: "X",
      numeroCapi: "50",
    });
    expect(r.numeroCapi).toBe(50);
  });

  it("includes cadenza when set", () => {
    const r = formToAziendaInput({
      ...emptyAziendaForm,
      nome: "X",
      cadenzaFatturazione: "monthly",
    });
    expect(r.cadenzaFatturazione).toBe("monthly");
  });

  it("converts armadiettoCanoneAnnuo to a number and omits when empty", () => {
    expect(
      formToAziendaInput({
        ...emptyAziendaForm,
        nome: "X",
        armadiettoCanoneAnnuo: "800",
      }).armadiettoCanoneAnnuo
    ).toBe(800);
    expect(
      "armadiettoCanoneAnnuo" in
        formToAziendaInput({ ...emptyAziendaForm, nome: "X" })
    ).toBe(false);
  });
});
