import { describe, expect, it } from "vitest";
import type { Azienda, CadenzaFatturazione } from "@vet/shared";
import { defaultPeriodForAzienda } from "../contoPeriodPolicy";

function az(cadenza?: CadenzaFatturazione): Azienda {
  return {
    id: "az1",
    nome: "Cascina",
    nomeNorm: "cascina",
    ...(cadenza ? { cadenzaFatturazione: cadenza } : {}),
    createdAt: new Date(2026, 0, 1),
    updatedAt: new Date(2026, 0, 1),
    createdBy: "u1",
    updatedBy: "u1",
    createdByName: "T",
    updatedByName: "T",
    isDeleted: false,
    schemaVersion: 1,
  };
}

describe("defaultPeriodForAzienda", () => {
  const may = new Date(2026, 4, 15);

  it("monthly → the single previous full calendar month", () => {
    expect(defaultPeriodForAzienda(az("monthly"), may)).toEqual({
      from: new Date(2026, 3, 1),
      to: new Date(2026, 3, 30),
    });
  });

  it("quarterly → the previous 3 full calendar months", () => {
    expect(defaultPeriodForAzienda(az("quarterly"), may)).toEqual({
      from: new Date(2026, 1, 1),
      to: new Date(2026, 3, 30),
    });
  });

  it("semiannual → the previous 6 months, crossing the year boundary", () => {
    expect(defaultPeriodForAzienda(az("semiannual"), may)).toEqual({
      from: new Date(2025, 10, 1),
      to: new Date(2026, 3, 30),
    });
  });

  it("unset cadenza → defaults to the previous 3 months", () => {
    expect(defaultPeriodForAzienda(az(), may)).toEqual({
      from: new Date(2026, 1, 1),
      to: new Date(2026, 3, 30),
    });
  });

  it("never includes the current month: `to` is the last day of the previous month", () => {
    const { to } = defaultPeriodForAzienda(az("quarterly"), may);
    expect(to.getMonth()).toBe(3);
    expect(to < new Date(2026, 4, 1)).toBe(true);
  });

  describe("January anchor (year boundary in the Date math)", () => {
    const jan = new Date(2026, 0, 10);

    it("monthly → December of the previous year", () => {
      expect(defaultPeriodForAzienda(az("monthly"), jan)).toEqual({
        from: new Date(2025, 11, 1),
        to: new Date(2025, 11, 31),
      });
    });

    it("quarterly → October through December of the previous year", () => {
      expect(defaultPeriodForAzienda(az("quarterly"), jan)).toEqual({
        from: new Date(2025, 9, 1),
        to: new Date(2025, 11, 31),
      });
    });
  });
});
