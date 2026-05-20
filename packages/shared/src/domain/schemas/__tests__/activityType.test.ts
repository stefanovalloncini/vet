import { describe, expect, it } from "vitest";
import {
  activityTypeInputSchema,
  activityTypeDocSchema,
  ACTIVITY_TYPE_SEEDS,
  GINECOLOGIA_TIPO_ID,
  slugify,
} from "../activityType.js";

describe("activityTypeInputSchema", () => {
  it("accepts a minimal input", () => {
    const r = activityTypeInputSchema.safeParse({
      nome: "Visita",
      ordine: 1,
    });
    expect(r.success).toBe(true);
  });

  it("defaults attivo to true when omitted", () => {
    const r = activityTypeInputSchema.safeParse({
      nome: "Visita",
      ordine: 1,
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.attivo).toBe(true);
  });

  it("rejects nome longer than 80 chars", () => {
    const r = activityTypeInputSchema.safeParse({
      nome: "x".repeat(81),
      ordine: 1,
    });
    expect(r.success).toBe(false);
  });

  it("rejects empty nome", () => {
    expect(
      activityTypeInputSchema.safeParse({ nome: "", ordine: 1 }).success
    ).toBe(false);
  });

  it("rejects whitespace-only nome", () => {
    expect(
      activityTypeInputSchema.safeParse({ nome: "   ", ordine: 1 }).success
    ).toBe(false);
  });

  it("rejects negative ordine", () => {
    expect(
      activityTypeInputSchema.safeParse({ nome: "x", ordine: -1 }).success
    ).toBe(false);
  });

  it("rejects non-integer ordine", () => {
    expect(
      activityTypeInputSchema.safeParse({ nome: "x", ordine: 1.5 }).success
    ).toBe(false);
  });

  it("rejects extra fields", () => {
    expect(
      activityTypeInputSchema.safeParse({
        nome: "x",
        ordine: 1,
        sneaky: 1,
      }).success
    ).toBe(false);
  });
});

describe("activityTypeDocSchema", () => {
  it("accepts a valid doc", () => {
    const now = new Date();
    const r = activityTypeDocSchema.safeParse({
      nome: "Visita",
      ordine: 1,
      attivo: true,
      createdAt: now,
      updatedAt: now,
      schemaVersion: 1,
    });
    expect(r.success).toBe(true);
  });

  it("rejects missing audit fields", () => {
    expect(
      activityTypeDocSchema.safeParse({
        nome: "Visita",
        ordine: 1,
        attivo: true,
        schemaVersion: 1,
      }).success
    ).toBe(false);
  });
});

describe("slugify", () => {
  it("lowercases, replaces spaces with dashes", () => {
    expect(slugify("Visita di controllo")).toBe(
      "visita-di-controllo"
    );
  });

  it("strips accents", () => {
    expect(slugify("Profilàssi")).toBe("profilassi");
  });

  it("trims and collapses whitespace", () => {
    expect(slugify("  Visita   ")).toBe("visita");
  });

  it("strips non-alphanumeric except dashes", () => {
    expect(slugify("Vis. di / controllo!")).toBe(
      "vis-di-controllo"
    );
  });
});

describe("ACTIVITY_TYPE_SEEDS", () => {
  it("includes Ginecologia", () => {
    expect(ACTIVITY_TYPE_SEEDS.find((s) => s.id === GINECOLOGIA_TIPO_ID)).toBeDefined();
  });

  it("has ginecologia slug matching GINECOLOGIA_TIPO_ID constant", () => {
    expect(slugify("Ginecologia")).toBe(GINECOLOGIA_TIPO_ID);
  });

  it("has unique slug ids", () => {
    const ids = ACTIVITY_TYPE_SEEDS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has strictly increasing ordine", () => {
    for (let i = 1; i < ACTIVITY_TYPE_SEEDS.length; i++) {
      expect(ACTIVITY_TYPE_SEEDS[i]!.ordine).toBeGreaterThan(
        ACTIVITY_TYPE_SEEDS[i - 1]!.ordine
      );
    }
  });
});
