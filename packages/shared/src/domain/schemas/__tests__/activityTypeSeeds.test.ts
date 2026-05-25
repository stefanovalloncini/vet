import { describe, expect, it } from "vitest";
import {
  ACTIVITY_TYPE_SEEDS,
  ALTRO_TIPO_ID,
  GINECOLOGIA_TIPO_ID,
  activityTypeInputSchema,
} from "../activityType.js";

type ExpectedSeed = (typeof ACTIVITY_TYPE_SEEDS)[number];

const EXPECTED_SEEDS: ReadonlyArray<ExpectedSeed> = [
  { id: GINECOLOGIA_TIPO_ID, nome: "Ginecologia", ordine: 1 },
  { id: "campioni-sangue", nome: "Campioni sangue", ordine: 2, tariffaStandard: 2, modalitaDefault: "adElemento" },
  { id: "dislocazione-abomasale-dx", nome: "Dislocazione abomasale dx", ordine: 3, tariffaStandard: 200, modalitaDefault: "fissa" },
  { id: "dislocazione-abomasale-sx", nome: "Dislocazione abomasale sx", ordine: 4, tariffaStandard: 200, modalitaDefault: "fissa" },
  { id: "ecografie-polmonari", nome: "Ecografie polmonari", ordine: 5, tariffaStandard: 150, modalitaDefault: "oraria" },
  { id: "eutanasia-vacca", nome: "Eutanasia vacca", ordine: 6, tariffaStandard: 100, modalitaDefault: "fissa" },
  { id: "eutanasia-vitello", nome: "Eutanasia vitello", ordine: 7, tariffaStandard: 50, modalitaDefault: "fissa" },
  { id: "flebo", nome: "Flebo", ordine: 8, tariffaStandard: 70, modalitaDefault: "fissa" },
  { id: "visita-clinica", nome: "Visita clinica", ordine: 9, tariffaStandard: 70, modalitaDefault: "fissa" },
  { id: ALTRO_TIPO_ID, nome: "Altro", ordine: 999 },
];

describe("ACTIVITY_TYPE_SEEDS — base listino (10 entries)", () => {
  it("matches the expected seed table exactly", () => {
    expect(ACTIVITY_TYPE_SEEDS).toEqual(EXPECTED_SEEDS);
  });

  it("seeds ginecologia first and altro last", () => {
    expect(ACTIVITY_TYPE_SEEDS[0]?.id).toBe(GINECOLOGIA_TIPO_ID);
    expect(ACTIVITY_TYPE_SEEDS[ACTIVITY_TYPE_SEEDS.length - 1]?.id).toBe(
      ALTRO_TIPO_ID
    );
  });

  it("ginecologia has no static tariffa (computed per cliente)", () => {
    const seed = ACTIVITY_TYPE_SEEDS.find((s) => s.id === GINECOLOGIA_TIPO_ID);
    expect(seed?.tariffaStandard).toBeUndefined();
    expect(seed?.modalitaDefault).toBeUndefined();
  });

  it("altro has no preset tariffa or modalita (note is the required input)", () => {
    const seed = ACTIVITY_TYPE_SEEDS.find((s) => s.id === ALTRO_TIPO_ID);
    expect(seed?.tariffaStandard).toBeUndefined();
    expect(seed?.modalitaDefault).toBeUndefined();
  });

  it("keeps dislocazione abomasale dx and sx as separate entries", () => {
    const dx = ACTIVITY_TYPE_SEEDS.find((s) => s.id === "dislocazione-abomasale-dx");
    const sx = ACTIVITY_TYPE_SEEDS.find((s) => s.id === "dislocazione-abomasale-sx");
    expect(dx).toBeDefined();
    expect(sx).toBeDefined();
    expect(dx?.nome).toBe("Dislocazione abomasale dx");
    expect(sx?.nome).toBe("Dislocazione abomasale sx");
  });

  it("ids are unique", () => {
    const ids = ACTIVITY_TYPE_SEEDS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every seed passes activityTypeInputSchema strict validation", () => {
    for (const seed of ACTIVITY_TYPE_SEEDS) {
      const { id: _id, ...input } = seed;
      const result = activityTypeInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    }
  });
});
