import { describe, expect, it } from "vitest";
import type { Attivita, Azienda, CadenzaFatturazione, Conto } from "@vet/shared";
import {
  defaultPeriodForAzienda,
  needsNewContoForAzienda,
} from "../contoPeriodPolicy";

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

function att(id: string, data: Date): Attivita {
  return { id, aziendaId: "az1", data, isDeleted: false } as unknown as Attivita;
}

function conto(p: {
  periodoFrom: Date;
  periodoTo: Date;
  modalita?: "emesso" | "proforma";
  isDeleted?: boolean;
  attivitaIds?: string[];
}): Conto {
  return {
    aziendaId: "az1",
    periodoFrom: p.periodoFrom,
    periodoTo: p.periodoTo,
    modalita: p.modalita ?? "emesso",
    isDeleted: p.isDeleted ?? false,
    attivitaIds: p.attivitaIds ?? [],
    emittedAt: new Date(2026, 3, 5),
  } as unknown as Conto;
}

describe("defaultPeriodForAzienda", () => {
  const may = new Date(2026, 4, 15);

  it("monthly → the previous full calendar month", () => {
    expect(defaultPeriodForAzienda(az("monthly"), may)).toEqual({
      from: new Date(2026, 3, 1),
      to: new Date(2026, 3, 30, 23, 59, 59, 999),
    });
  });

  it("quarterly → the previous full calendar quarter (Jan–Mar in Q2)", () => {
    expect(defaultPeriodForAzienda(az("quarterly"), may)).toEqual({
      from: new Date(2026, 0, 1),
      to: new Date(2026, 2, 31, 23, 59, 59, 999),
    });
  });

  it("semiannual → the previous full calendar semester (H2 of prior year)", () => {
    expect(defaultPeriodForAzienda(az("semiannual"), may)).toEqual({
      from: new Date(2025, 6, 1),
      to: new Date(2025, 11, 31, 23, 59, 59, 999),
    });
  });

  it("unset cadenza → defaults to the previous full calendar quarter", () => {
    expect(defaultPeriodForAzienda(az(), may)).toEqual({
      from: new Date(2026, 0, 1),
      to: new Date(2026, 2, 31, 23, 59, 59, 999),
    });
  });

  it("never includes the current period: `to` precedes the current quarter start", () => {
    const { to } = defaultPeriodForAzienda(az("quarterly"), may);
    expect(to < new Date(2026, 3, 1)).toBe(true);
  });

  describe("January anchor (year boundary)", () => {
    const jan = new Date(2026, 0, 10);

    it("monthly → December of the previous year", () => {
      expect(defaultPeriodForAzienda(az("monthly"), jan)).toEqual({
        from: new Date(2025, 11, 1),
        to: new Date(2025, 11, 31, 23, 59, 59, 999),
      });
    });

    it("quarterly → Q4 of the previous year", () => {
      expect(defaultPeriodForAzienda(az("quarterly"), jan)).toEqual({
        from: new Date(2025, 9, 1),
        to: new Date(2025, 11, 31, 23, 59, 59, 999),
      });
    });
  });
});

describe("needsNewContoForAzienda", () => {
  const may = new Date(2026, 4, 15);

  it("flags when the just-closed quarter has unbilled attività and no covering conto", () => {
    const attivita = [att("a1", new Date(2026, 1, 10))];
    expect(
      needsNewContoForAzienda({
        azienda: az("quarterly"),
        conti: [],
        attivita,
        billedIds: new Set(),
        now: may,
      })
    ).toBe(true);
  });

  it("does not flag when an emitted conto already covers the period", () => {
    const attivita = [att("a1", new Date(2026, 1, 10))];
    const conti = [
      conto({
        periodoFrom: new Date(2026, 0, 1),
        periodoTo: new Date(2026, 2, 31, 23, 59, 59, 999),
        attivitaIds: ["a1"],
      }),
    ];
    expect(
      needsNewContoForAzienda({
        azienda: az("quarterly"),
        conti,
        attivita,
        billedIds: new Set(["a1"]),
        now: may,
      })
    ).toBe(false);
  });

  it("does not flag when the period is covered even if the activity is still unbilled", () => {
    const attivita = [att("a1", new Date(2026, 1, 10))];
    const conti = [
      conto({
        periodoFrom: new Date(2026, 0, 1),
        periodoTo: new Date(2026, 2, 31, 23, 59, 59, 999),
      }),
    ];
    expect(
      needsNewContoForAzienda({
        azienda: az("quarterly"),
        conti,
        attivita,
        billedIds: new Set(),
        now: may,
      })
    ).toBe(false);
  });

  it("ignores a proforma conto for coverage (still flags)", () => {
    const attivita = [att("a1", new Date(2026, 1, 10))];
    const conti = [
      conto({
        periodoFrom: new Date(2026, 0, 1),
        periodoTo: new Date(2026, 2, 31, 23, 59, 59, 999),
        modalita: "proforma",
      }),
    ];
    expect(
      needsNewContoForAzienda({
        azienda: az("quarterly"),
        conti,
        attivita,
        billedIds: new Set(),
        now: may,
      })
    ).toBe(true);
  });

  it("ignores a deleted conto for coverage (still flags)", () => {
    const attivita = [att("a1", new Date(2026, 1, 10))];
    const conti = [
      conto({
        periodoFrom: new Date(2026, 0, 1),
        periodoTo: new Date(2026, 2, 31, 23, 59, 59, 999),
        isDeleted: true,
      }),
    ];
    expect(
      needsNewContoForAzienda({
        azienda: az("quarterly"),
        conti,
        attivita,
        billedIds: new Set(),
        now: may,
      })
    ).toBe(true);
  });

  it("does not flag when the only unbilled attività fall outside the closed period", () => {
    const attivita = [att("a1", new Date(2026, 4, 2))];
    expect(
      needsNewContoForAzienda({
        azienda: az("quarterly"),
        conti: [],
        attivita,
        billedIds: new Set(),
        now: may,
      })
    ).toBe(false);
  });

  it("does not flag mid-period with no unbilled attività in the closed period", () => {
    const attivita = [att("a1", new Date(2026, 1, 10))];
    expect(
      needsNewContoForAzienda({
        azienda: az("quarterly"),
        conti: [],
        attivita,
        billedIds: new Set(["a1"]),
        now: may,
      })
    ).toBe(false);
  });

  it("does not flag an azienda without cadenza", () => {
    const attivita = [att("a1", new Date(2026, 1, 10))];
    expect(
      needsNewContoForAzienda({
        azienda: az(),
        conti: [],
        attivita,
        billedIds: new Set(),
        now: may,
      })
    ).toBe(false);
  });

  it("does not flag when there are no attività at all", () => {
    expect(
      needsNewContoForAzienda({
        azienda: az("quarterly"),
        conti: [],
        attivita: [],
        billedIds: new Set(),
        now: may,
      })
    ).toBe(false);
  });

  it("ignores conti and attività belonging to other aziende", () => {
    const attivita = [
      { id: "x1", aziendaId: "other", data: new Date(2026, 1, 10), isDeleted: false },
    ] as unknown as Attivita[];
    const conti = [
      {
        aziendaId: "other",
        periodoFrom: new Date(2026, 0, 1),
        periodoTo: new Date(2026, 2, 31, 23, 59, 59, 999),
        modalita: "emesso",
        isDeleted: false,
        attivitaIds: [],
        emittedAt: new Date(2026, 3, 5),
      },
    ] as unknown as Conto[];
    expect(
      needsNewContoForAzienda({
        azienda: az("quarterly"),
        conti,
        attivita,
        billedIds: new Set(),
        now: may,
      })
    ).toBe(false);
  });
});
