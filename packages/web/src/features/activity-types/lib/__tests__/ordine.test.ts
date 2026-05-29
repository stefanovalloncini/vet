import { describe, expect, it } from "vitest";
import { ALTRO_TIPO_ID, type ActivityType } from "@vet/shared";
import { nextOrdine } from "../ordine";

function tipo(id: string, ordine: number): ActivityType {
  return {
    id,
    nome: id,
    ordine,
    attivo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    schemaVersion: 1,
  };
}

describe("nextOrdine", () => {
  it("returns 10 when the list is empty", () => {
    expect(nextOrdine([])).toBe(10);
  });

  it("returns max(ordine) + 10 for a populated list", () => {
    expect(
      nextOrdine([tipo("a", 10), tipo("b", 20), tipo("c", 5)])
    ).toBe(30);
  });

  it("handles a single item correctly", () => {
    expect(nextOrdine([tipo("x", 100)])).toBe(110);
  });

  it("returns 10 when all ordine values are 0 or negative", () => {
    expect(nextOrdine([tipo("a", 0), tipo("b", -5)])).toBe(10);
  });

  it("never exceeds the schema max of 1000 (clamps)", () => {
    expect(nextOrdine([tipo("a", 999), tipo("b", 1)])).toBe(1000);
    expect(nextOrdine([tipo("a", 1000)])).toBe(1000);
  });

  it("excludes the Altro sentinel so new types slot before it", () => {
    expect(
      nextOrdine([tipo("visita", 50), tipo(ALTRO_TIPO_ID, 999)])
    ).toBe(60);
  });
});
