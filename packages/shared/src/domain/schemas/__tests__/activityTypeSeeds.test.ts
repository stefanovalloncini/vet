import { describe, expect, it } from "vitest";
import {
  ACTIVITY_TYPE_SEEDS,
  ALTRO_TIPO_ID,
  GINECOLOGIA_TIPO_ID,
} from "../activityType.js";

describe("ACTIVITY_TYPE_SEEDS — minimal seed (admin adds the rest)", () => {
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

  it("ids are unique", () => {
    const ids = ACTIVITY_TYPE_SEEDS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
