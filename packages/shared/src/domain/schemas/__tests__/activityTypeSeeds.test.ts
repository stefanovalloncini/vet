import { describe, expect, it } from "vitest";
import { ACTIVITY_TYPE_SEEDS, GINECOLOGIA_TIPO_ID } from "../activityType.js";

describe("ACTIVITY_TYPE_SEEDS — Alessandro price list", () => {
  it("pins ginecologia first (ordine 1)", () => {
    const first = ACTIVITY_TYPE_SEEDS[0];
    expect(first?.id).toBe(GINECOLOGIA_TIPO_ID);
    expect(first?.ordine).toBe(1);
  });

  it("includes every type from the price list", () => {
    const expectedIds = [
      "ginecologia",
      "dislocazione-abomasale-sx",
      "dislocazione-abomasale-dx",
      "ecografie-polmonari",
      "campioni-sangue",
      "eutanasia-vacca",
      "eutanasia-vitello",
      "flebo",
      "visita-clinica",
      "altro",
    ];
    const ids = ACTIVITY_TYPE_SEEDS.map((s) => s.id);
    for (const id of expectedIds) {
      expect(ids).toContain(id);
    }
  });

  it("keeps Altro at the end with the largest ordine", () => {
    const maxOrdine = Math.max(...ACTIVITY_TYPE_SEEDS.map((s) => s.ordine));
    const altro = ACTIVITY_TYPE_SEEDS.find((s) => s.id === "altro");
    expect(altro?.ordine).toBe(maxOrdine);
  });

  it.each<[string, number]>([
    ["dislocazione-abomasale-sx", 200],
    ["dislocazione-abomasale-dx", 200],
    ["ecografie-polmonari", 150],
    ["campioni-sangue", 2],
    ["eutanasia-vacca", 100],
    ["eutanasia-vitello", 50],
    ["flebo", 70],
    ["visita-clinica", 70],
  ])("seeds tariffa %s = %d", (id, expected) => {
    const seed = ACTIVITY_TYPE_SEEDS.find((s) => s.id === id);
    expect(seed?.tariffaStandard).toBe(expected);
  });

  it("ginecologia has no static tariffa (computed per cliente)", () => {
    const seed = ACTIVITY_TYPE_SEEDS.find((s) => s.id === GINECOLOGIA_TIPO_ID);
    expect(seed?.tariffaStandard).toBeUndefined();
  });

  it("ordine values are unique and strictly ascending", () => {
    for (let i = 1; i < ACTIVITY_TYPE_SEEDS.length; i++) {
      expect(ACTIVITY_TYPE_SEEDS[i]!.ordine).toBeGreaterThan(
        ACTIVITY_TYPE_SEEDS[i - 1]!.ordine
      );
    }
  });

  it("ids are unique", () => {
    const ids = ACTIVITY_TYPE_SEEDS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
