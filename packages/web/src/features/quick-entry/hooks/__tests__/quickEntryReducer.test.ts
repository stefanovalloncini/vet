import { describe, it, expect } from "vitest";
import type { ActivityType } from "@vet/shared";
import { GINECOLOGIA_TIPO_ID } from "@vet/shared";
import {
  defaultTariffaForTipo,
  initialQuickEntryFields,
  quickEntryReducer,
} from "../quickEntryReducer";

function tipo(over: Partial<ActivityType> & Pick<ActivityType, "id" | "nome">): ActivityType {
  return {
    ordine: 0,
    attivo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    schemaVersion: 1,
    ...over,
  } as ActivityType;
}

describe("quickEntryReducer", () => {
  it("starts with empty fields and today's date", () => {
    const s = initialQuickEntryFields();
    expect(s.aziendaId).toBe("");
    expect(s.tipoId).toBe("");
    expect(s.tariffa).toBe("");
    expect(s.skipDupCheck).toBe(false);
    expect(s.error).toBeNull();
    expect(s.data).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("set-data updates data and disarms dup-skip", () => {
    const s = { ...initialQuickEntryFields(), skipDupCheck: true };
    const next = quickEntryReducer(s, { type: "set-data", value: "2026-02-01" });
    expect(next.data).toBe("2026-02-01");
    expect(next.skipDupCheck).toBe(false);
  });

  it("set-data is a no-op when value is unchanged (preserves dup-skip)", () => {
    const s = { ...initialQuickEntryFields(), data: "2026-02-01", skipDupCheck: true };
    const next = quickEntryReducer(s, { type: "set-data", value: "2026-02-01" });
    expect(next).toBe(s);
  });

  it("set-azienda updates azienda and disarms dup-skip", () => {
    const s = { ...initialQuickEntryFields(), skipDupCheck: true };
    const next = quickEntryReducer(s, { type: "set-azienda", value: "az1" });
    expect(next.aziendaId).toBe("az1");
    expect(next.skipDupCheck).toBe(false);
  });

  it("set-azienda is a no-op when value is unchanged", () => {
    const s = { ...initialQuickEntryFields(), aziendaId: "az1", skipDupCheck: true };
    const next = quickEntryReducer(s, { type: "set-azienda", value: "az1" });
    expect(next).toBe(s);
  });

  it("set-tipo applies the default tariffa when tariffa is empty", () => {
    const s = initialQuickEntryFields();
    const next = quickEntryReducer(s, {
      type: "set-tipo",
      value: "visita",
      defaultTariffa: "30",
    });
    expect(next.tipoId).toBe("visita");
    expect(next.tariffa).toBe("30");
    expect(next.skipDupCheck).toBe(false);
  });

  it("set-tipo keeps the user's tariffa when already typed", () => {
    const s = { ...initialQuickEntryFields(), tariffa: "75" };
    const next = quickEntryReducer(s, {
      type: "set-tipo",
      value: "visita",
      defaultTariffa: "30",
    });
    expect(next.tariffa).toBe("75");
  });

  it("set-tipo with no default leaves tariffa empty", () => {
    const s = initialQuickEntryFields();
    const next = quickEntryReducer(s, {
      type: "set-tipo",
      value: "visita",
      defaultTariffa: null,
    });
    expect(next.tariffa).toBe("");
  });

  it("set-tipo is a no-op when value is unchanged", () => {
    const s = { ...initialQuickEntryFields(), tipoId: "visita", skipDupCheck: true };
    const next = quickEntryReducer(s, {
      type: "set-tipo",
      value: "visita",
      defaultTariffa: "30",
    });
    expect(next).toBe(s);
  });

  it("set-tariffa overwrites the tariffa", () => {
    const s = { ...initialQuickEntryFields(), tariffa: "10" };
    const next = quickEntryReducer(s, { type: "set-tariffa", value: "99" });
    expect(next.tariffa).toBe("99");
  });

  it("set-error sets the error message", () => {
    const s = initialQuickEntryFields();
    const next = quickEntryReducer(s, { type: "set-error", value: "boom" });
    expect(next.error).toBe("boom");
  });

  it("arm-dup-skip flips the skipDupCheck flag", () => {
    const s = initialQuickEntryFields();
    const next = quickEntryReducer(s, { type: "arm-dup-skip" });
    expect(next.skipDupCheck).toBe(true);
  });

  it("reset clears everything when keepDate is false", () => {
    const s = {
      data: "2026-02-01",
      aziendaId: "az1",
      tipoId: "v",
      tariffa: "50",
      skipDupCheck: true,
      error: "boom",
    };
    const next = quickEntryReducer(s, { type: "reset", keepDate: false });
    expect(next.aziendaId).toBe("");
    expect(next.tipoId).toBe("");
    expect(next.tariffa).toBe("");
    expect(next.skipDupCheck).toBe(false);
    expect(next.error).toBeNull();
    expect(next.data).not.toBe("2026-02-01");
  });

  it("reset preserves date when keepDate is true", () => {
    const s = {
      data: "2026-02-01",
      aziendaId: "az1",
      tipoId: "v",
      tariffa: "50",
      skipDupCheck: true,
      error: "boom",
    };
    const next = quickEntryReducer(s, { type: "reset", keepDate: true });
    expect(next.data).toBe("2026-02-01");
    expect(next.aziendaId).toBe("");
    expect(next.tipoId).toBe("");
    expect(next.tariffa).toBe("");
  });
});

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
