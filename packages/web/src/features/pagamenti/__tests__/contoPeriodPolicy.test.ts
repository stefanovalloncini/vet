import { describe, expect, it } from "vitest";
import type { Azienda, CadenzaFatturazione } from "@vet/shared";
import { defaultPeriodForAzienda } from "../lib/contoPeriodPolicy";

function makeAzienda(cadenza: CadenzaFatturazione | undefined): Azienda {
  return {
    id: "a1",
    nome: "Cascina Alfa",
    nomeNorm: "cascina alfa",
    ...(cadenza ? { cadenzaFatturazione: cadenza } : {}),
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    createdBy: "u1",
    updatedBy: "u1",
    createdByName: "Tester",
    updatedByName: "Tester",
    isDeleted: false,
    schemaVersion: 1,
  };
}

describe("defaultPeriodForAzienda", () => {
  // Anchor "today" to mid-May 2026 so the previous month is April.
  const TODAY = new Date(2026, 4, 15); // 2026-05-15

  it("monthly → previous calendar month (April)", () => {
    const { from, to } = defaultPeriodForAzienda(makeAzienda("monthly"), TODAY);
    expect(from.getFullYear()).toBe(2026);
    expect(from.getMonth()).toBe(3); // April (0-indexed)
    expect(from.getDate()).toBe(1);
    expect(to.getFullYear()).toBe(2026);
    expect(to.getMonth()).toBe(3);
    expect(to.getDate()).toBe(30); // April has 30 days
  });

  it("quarterly → previous three calendar months (Feb–Apr)", () => {
    const { from, to } = defaultPeriodForAzienda(makeAzienda("quarterly"), TODAY);
    expect(from.getMonth()).toBe(1); // February
    expect(from.getDate()).toBe(1);
    expect(to.getMonth()).toBe(3); // April end
    expect(to.getDate()).toBe(30);
  });

  it("semiannual → previous six calendar months (Nov 2025 – Apr 2026)", () => {
    const { from, to } = defaultPeriodForAzienda(makeAzienda("semiannual"), TODAY);
    expect(from.getFullYear()).toBe(2025);
    expect(from.getMonth()).toBe(10); // November
    expect(from.getDate()).toBe(1);
    expect(to.getFullYear()).toBe(2026);
    expect(to.getMonth()).toBe(3);
    expect(to.getDate()).toBe(30);
  });

  it("undefined cadenza → defaults to previous 3 months", () => {
    const { from, to } = defaultPeriodForAzienda(makeAzienda(undefined), TODAY);
    expect(from.getMonth()).toBe(1); // February
    expect(to.getMonth()).toBe(3); // April
  });

  it("handles year boundary (today in January)", () => {
    const today = new Date(2026, 0, 10); // 2026-01-10
    const { from, to } = defaultPeriodForAzienda(makeAzienda("monthly"), today);
    // Previous month = December 2025
    expect(from.getFullYear()).toBe(2025);
    expect(from.getMonth()).toBe(11); // December
    expect(from.getDate()).toBe(1);
    expect(to.getFullYear()).toBe(2025);
    expect(to.getMonth()).toBe(11);
    expect(to.getDate()).toBe(31);
  });
});
