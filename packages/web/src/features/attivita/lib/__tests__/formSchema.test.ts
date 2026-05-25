import { describe, expect, it } from "vitest";
import {
  attivitaFormSchema,
  emptyFormValues,
  formValuesToInput,
} from "../formSchema";

function base() {
  return {
    data: "2026-05-26",
    aziendaId: "a1",
    tipoId: "t1",
    oraria: false,
    adElemento: false,
    tariffa: "50",
    ore: "",
    elementi: "",
    note: "",
    reminderAt: "",
    reminderTitle: "",
  };
}

describe("attivitaFormSchema", () => {
  it("validates a minimal flat-rate entry", () => {
    expect(attivitaFormSchema.safeParse(base()).success).toBe(true);
  });

  it("rejects invalid date", () => {
    const r = attivitaFormSchema.safeParse({ ...base(), data: "not-a-date" });
    expect(r.success).toBe(false);
  });

  it("rejects empty tariffa", () => {
    const r = attivitaFormSchema.safeParse({ ...base(), tariffa: "" });
    expect(r.success).toBe(false);
  });

  it("rejects tariffa <= 0", () => {
    const r = attivitaFormSchema.safeParse({ ...base(), tariffa: "0" });
    expect(r.success).toBe(false);
    const r2 = attivitaFormSchema.safeParse({ ...base(), tariffa: "-5" });
    expect(r2.success).toBe(false);
  });

  it("rejects both oraria and adElemento set at the same time", () => {
    const r = attivitaFormSchema.safeParse({
      ...base(),
      oraria: true,
      adElemento: true,
      ore: "2",
      elementi: "5",
    });
    expect(r.success).toBe(false);
  });

  it("requires ore when oraria=true", () => {
    const r = attivitaFormSchema.safeParse({
      ...base(),
      oraria: true,
      ore: "",
    });
    expect(r.success).toBe(false);
  });

  it("accepts oraria with positive ore", () => {
    const r = attivitaFormSchema.safeParse({
      ...base(),
      oraria: true,
      ore: "2.5",
    });
    expect(r.success).toBe(true);
  });

  it("requires integer elementi when adElemento=true", () => {
    const r = attivitaFormSchema.safeParse({
      ...base(),
      adElemento: true,
      elementi: "2.5",
    });
    expect(r.success).toBe(false);
  });

  it("rejects elementi <= 0", () => {
    const r = attivitaFormSchema.safeParse({
      ...base(),
      adElemento: true,
      elementi: "0",
    });
    expect(r.success).toBe(false);
  });
});

describe("emptyFormValues", () => {
  it("uses today as default date when no preset", () => {
    const r = emptyFormValues();
    expect(r.data).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("uses preset date when provided", () => {
    expect(emptyFormValues("2026-01-15").data).toBe("2026-01-15");
  });
});

describe("formValuesToInput", () => {
  it("converts a fixed-rate form to AttivitaInput", () => {
    const r = formValuesToInput(base());
    expect(r.aziendaId).toBe("a1");
    expect(r.tariffa).toBe(50);
    expect(r.oraria).toBe(false);
    expect("ore" in r).toBe(false);
  });

  it("includes ore when oraria=true", () => {
    const r = formValuesToInput({
      ...base(),
      oraria: true,
      ore: "3",
    });
    expect(r.ore).toBe(3);
  });

  it("includes elementi when adElemento=true", () => {
    const r = formValuesToInput({
      ...base(),
      adElemento: true,
      elementi: "10",
    });
    expect(r.elementi).toBe(10);
  });

  it("trims and includes note when not empty", () => {
    const r = formValuesToInput({ ...base(), note: "  test  " });
    expect(r.note).toBe("test");
  });

  it("omits note when empty/whitespace", () => {
    const r = formValuesToInput({ ...base(), note: "   " });
    expect("note" in r).toBe(false);
  });

  it("throws on invalid date input", () => {
    expect(() =>
      formValuesToInput({ ...base(), data: "not-a-date" })
    ).toThrow(/invalid-date/);
  });
});
