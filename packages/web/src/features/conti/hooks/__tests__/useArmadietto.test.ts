import { renderHook, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Azienda } from "@vet/shared";
import { useArmadietto } from "../useArmadietto";

function azienda(over: Partial<Azienda> = {}): Azienda {
  return {
    id: "az1",
    nome: "Cascina",
    nomeNorm: "cascina",
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: "u",
    updatedBy: "u",
    createdByName: "U",
    updatedByName: "U",
    isDeleted: false,
    schemaVersion: 1,
    ...over,
  };
}

const q1From = new Date(2026, 0, 1);
const q1To = new Date(2026, 2, 31);

describe("useArmadietto", () => {
  it("is not applicable when the azienda has no canone", () => {
    const { result } = renderHook(() =>
      useArmadietto(azienda(), q1From, q1To)
    );
    expect(result.current.applicable).toBe(false);
    expect(result.current.attivo).toBe(false);
    expect(result.current.importoNum).toBeNull();
  });

  it("suggests the prorated amount for a quarter (800/anno -> 200)", () => {
    const { result } = renderHook(() =>
      useArmadietto(azienda({ armadiettoCanoneAnnuo: 800 }), q1From, q1To)
    );
    expect(result.current.applicable).toBe(true);
    expect(result.current.attivo).toBe(true);
    expect(result.current.suggested).toBe(200);
    expect(result.current.importoNum).toBe(200);
  });

  it("reflects a manual edit in importoNum", () => {
    const { result } = renderHook(() =>
      useArmadietto(azienda({ armadiettoCanoneAnnuo: 800 }), q1From, q1To)
    );
    act(() => result.current.setImporto("180"));
    expect(result.current.importoNum).toBe(180);
  });

  it("returns null importoNum for empty or invalid input", () => {
    const { result } = renderHook(() =>
      useArmadietto(azienda({ armadiettoCanoneAnnuo: 800 }), q1From, q1To)
    );
    act(() => result.current.setImporto(""));
    expect(result.current.importoNum).toBeNull();
    act(() => result.current.setImporto("-5"));
    expect(result.current.importoNum).toBeNull();
  });

  it("can be toggled off", () => {
    const { result } = renderHook(() =>
      useArmadietto(azienda({ armadiettoCanoneAnnuo: 800 }), q1From, q1To)
    );
    act(() => result.current.setAttivo(false));
    expect(result.current.attivo).toBe(false);
  });

  it("suggests zero when the period is invalid (null bounds)", () => {
    const { result } = renderHook(() =>
      useArmadietto(azienda({ armadiettoCanoneAnnuo: 800 }), null, null)
    );
    expect(result.current.suggested).toBe(0);
  });

  it("re-suggests the prorated amount when the period changes", () => {
    const { result, rerender } = renderHook(
      ({ from, to }) =>
        useArmadietto(azienda({ armadiettoCanoneAnnuo: 800 }), from, to),
      { initialProps: { from: q1From, to: q1To } }
    );
    expect(result.current.importoNum).toBe(200);
    rerender({ from: new Date(2026, 0, 1), to: new Date(2026, 11, 31) });
    expect(result.current.suggested).toBe(800);
    expect(result.current.importoNum).toBe(800);
  });

  it("keeps a manual edit while the period is unchanged", () => {
    const { result, rerender } = renderHook(
      ({ from, to }) =>
        useArmadietto(azienda({ armadiettoCanoneAnnuo: 800 }), from, to),
      { initialProps: { from: q1From, to: q1To } }
    );
    act(() => result.current.setImporto("123"));
    expect(result.current.importoNum).toBe(123);
    rerender({ from: q1From, to: q1To });
    expect(result.current.importoNum).toBe(123);
  });

  it("overrides a manual edit when the period changes the suggestion", () => {
    const { result, rerender } = renderHook(
      ({ from, to }) =>
        useArmadietto(azienda({ armadiettoCanoneAnnuo: 800 }), from, to),
      { initialProps: { from: q1From, to: q1To } }
    );
    act(() => result.current.setImporto("123"));
    rerender({ from: new Date(2026, 0, 1), to: new Date(2026, 5, 30) });
    expect(result.current.importoNum).toBe(400);
  });
});
