import { describe, expect, it } from "vitest";
import { ACTIVITY_TYPE_SEEDS, GINECOLOGIA_TIPO_ID } from "../activityType.js";

describe("ACTIVITY_TYPE_SEEDS — minimal seed (admin adds the rest)", () => {
  it("seeds exactly one type: Ginecologia", () => {
    expect(ACTIVITY_TYPE_SEEDS).toHaveLength(1);
    const seed = ACTIVITY_TYPE_SEEDS[0];
    expect(seed?.id).toBe(GINECOLOGIA_TIPO_ID);
    expect(seed?.nome).toBe("Ginecologia");
    expect(seed?.ordine).toBe(1);
  });

  it("ginecologia has no static tariffa (computed per cliente)", () => {
    const seed = ACTIVITY_TYPE_SEEDS.find((s) => s.id === GINECOLOGIA_TIPO_ID);
    expect(seed?.tariffaStandard).toBeUndefined();
  });

  it("ginecologia has no modalitaDefault (defaults to fissa in form)", () => {
    const seed = ACTIVITY_TYPE_SEEDS.find((s) => s.id === GINECOLOGIA_TIPO_ID);
    expect(seed?.modalitaDefault).toBeUndefined();
  });

  it("ids are unique", () => {
    const ids = ACTIVITY_TYPE_SEEDS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
