import { describe, expect, it } from "vitest";
import { ALTRO_TIPO_ID } from "@vet/shared";
import { quickEntryFormSchema } from "../quickEntryFormSchema";

const base = {
  data: "2026-05-29",
  aziendaId: "az1",
  tipoId: "tipo1",
  modalita: "fissa" as const,
  tariffa: "80",
  ore: "",
  elementi: "",
  note: "",
};

function failsAt(input: Record<string, unknown>, path: string): boolean {
  const r = quickEntryFormSchema.safeParse(input);
  return !r.success && r.error.issues.some((i) => i.path[0] === path);
}

describe("quickEntryFormSchema", () => {
  it("accepts a valid fissa entry", () => {
    expect(quickEntryFormSchema.safeParse(base).success).toBe(true);
  });

  it("requires azienda, tipo, and data", () => {
    expect(failsAt({ ...base, aziendaId: "" }, "aziendaId")).toBe(true);
    expect(failsAt({ ...base, tipoId: "" }, "tipoId")).toBe(true);
    expect(failsAt({ ...base, data: "" }, "data")).toBe(true);
  });

  it("rejects an empty or non-positive tariffa", () => {
    expect(failsAt({ ...base, tariffa: "" }, "tariffa")).toBe(true);
    expect(failsAt({ ...base, tariffa: "0" }, "tariffa")).toBe(true);
    expect(failsAt({ ...base, tariffa: "-5" }, "tariffa")).toBe(true);
    expect(failsAt({ ...base, tariffa: "abc" }, "tariffa")).toBe(true);
  });

  it("rejects a tariffa with >2 decimals or over the 100k cap (matches the shared schema)", () => {
    expect(failsAt({ ...base, tariffa: "19.999" }, "tariffa")).toBe(true);
    expect(failsAt({ ...base, tariffa: "200000" }, "tariffa")).toBe(true);
  });

  it("accepts float-fragile 2-decimal tariffe inline", () => {
    for (const tariffa of ["19.99", "0.07", "8.55", "70.10"]) {
      expect(quickEntryFormSchema.safeParse({ ...base, tariffa }).success).toBe(true);
    }
  });

  it("requires positive ore when modalita is oraria", () => {
    expect(failsAt({ ...base, modalita: "oraria", ore: "" }, "ore")).toBe(true);
    expect(failsAt({ ...base, modalita: "oraria", ore: "0" }, "ore")).toBe(true);
    expect(
      quickEntryFormSchema.safeParse({ ...base, modalita: "oraria", ore: "2.5" }).success
    ).toBe(true);
  });

  it("requires a positive integer elementi when modalita is adElemento", () => {
    expect(failsAt({ ...base, modalita: "adElemento", elementi: "" }, "elementi")).toBe(true);
    expect(failsAt({ ...base, modalita: "adElemento", elementi: "3.5" }, "elementi")).toBe(true);
    expect(failsAt({ ...base, modalita: "adElemento", elementi: "0" }, "elementi")).toBe(true);
    expect(
      quickEntryFormSchema.safeParse({ ...base, modalita: "adElemento", elementi: "3" }).success
    ).toBe(true);
  });

  it("requires a note when the tipo is Altro", () => {
    expect(failsAt({ ...base, tipoId: ALTRO_TIPO_ID, note: "   " }, "note")).toBe(true);
    expect(
      quickEntryFormSchema.safeParse({
        ...base,
        tipoId: ALTRO_TIPO_ID,
        note: "dettaglio",
      }).success
    ).toBe(true);
  });
});
