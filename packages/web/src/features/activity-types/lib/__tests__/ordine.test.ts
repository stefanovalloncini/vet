import { describe, expect, it } from "vitest";
import type { ActivityType } from "@vet/shared";
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

  it("ignores non-numeric ordine gaps and returns +10 from the highest", () => {
    expect(nextOrdine([tipo("a", 999), tipo("b", 1)])).toBe(1009);
  });

  it("returns 10 when all ordine values are 0 or negative", () => {
    expect(nextOrdine([tipo("a", 0), tipo("b", -5)])).toBe(10);
  });
});
