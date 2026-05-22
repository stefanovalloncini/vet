import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { InMemoryActivityTypesRepository } from "@vet/shared/testing";
import type { Repositories } from "@vet/shared";
import { RepositoriesProvider } from "../../../../infrastructure/RepositoriesContext";
import {
  parseTariffa,
  useActivityTypesEditor,
} from "../useActivityTypesEditor";

function makeRepos(repo: InMemoryActivityTypesRepository): Repositories {
  return { activityTypes: repo } as unknown as Repositories;
}

function wrapperFor(repo: InMemoryActivityTypesRepository) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <RepositoriesProvider value={makeRepos(repo)}>
        {children}
      </RepositoriesProvider>
    );
  };
}

async function seedRepo() {
  const repo = new InMemoryActivityTypesRepository();
  await repo.upsert("visita", {
    nome: "Visita",
    ordine: 10,
    attivo: true,
    tariffaStandard: 50,
  });
  await repo.upsert("ecografia", {
    nome: "Ecografia",
    ordine: 20,
    attivo: false,
  });
  return repo;
}

describe("parseTariffa", () => {
  it("returns null for empty input", () => {
    expect(parseTariffa("")).toEqual({ kind: "ok", value: null });
    expect(parseTariffa("   ")).toEqual({ kind: "ok", value: null });
  });

  it("parses positive numbers", () => {
    expect(parseTariffa("42")).toEqual({ kind: "ok", value: 42 });
    expect(parseTariffa("12.5")).toEqual({ kind: "ok", value: 12.5 });
  });

  it("rejects negative and non-numeric input", () => {
    expect(parseTariffa("-1")).toEqual({ kind: "invalid" });
    expect(parseTariffa("abc")).toEqual({ kind: "invalid" });
  });
});

describe("useActivityTypesEditor", () => {
  it("loads items and splits by active/inactive", async () => {
    const repo = await seedRepo();
    const { result } = renderHook(() => useActivityTypesEditor(), {
      wrapper: wrapperFor(repo),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.active).toHaveLength(1);
    expect(result.current.active[0]?.id).toBe("visita");
    expect(result.current.inactive).toHaveLength(1);
    expect(result.current.inactive[0]?.id).toBe("ecografia");
  });

  it("toggles active state via the repo and refreshes", async () => {
    const repo = await seedRepo();
    const { result } = renderHook(() => useActivityTypesEditor(), {
      wrapper: wrapperFor(repo),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    const tipo = result.current.active[0]!;
    await act(async () => {
      await result.current.toggleActive(tipo);
    });
    expect(result.current.active).toHaveLength(0);
    expect(result.current.inactive.some((t) => t.id === "visita")).toBe(true);
    expect(result.current.globalError).toBeNull();
  });

  it("saves a numeric tariffa", async () => {
    const repo = await seedRepo();
    const { result } = renderHook(() => useActivityTypesEditor(), {
      wrapper: wrapperFor(repo),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    const tipo = result.current.active[0]!;
    await act(async () => {
      await result.current.saveTariffa(tipo, "99.5");
    });
    const stored = await repo.getById("visita");
    expect(stored?.tariffaStandard).toBe(99.5);
  });

  it("clears tariffa when value is empty", async () => {
    const repo = await seedRepo();
    const { result } = renderHook(() => useActivityTypesEditor(), {
      wrapper: wrapperFor(repo),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    const tipo = result.current.active[0]!;
    await act(async () => {
      await result.current.saveTariffa(tipo, "");
    });
    const stored = await repo.getById("visita");
    expect(stored?.tariffaStandard).toBeUndefined();
  });

  it("rejects invalid tariffa input with a global error", async () => {
    const repo = await seedRepo();
    const setStandardTariff = vi.spyOn(repo, "setStandardTariff");
    const { result } = renderHook(() => useActivityTypesEditor(), {
      wrapper: wrapperFor(repo),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    const tipo = result.current.active[0]!;
    await act(async () => {
      await result.current.saveTariffa(tipo, "-3");
    });
    expect(setStandardTariff).not.toHaveBeenCalled();
    expect(result.current.globalError).toBe("Tariffa non valida");
  });

  it("surfaces a generic error when the repo throws", async () => {
    const repo = await seedRepo();
    vi.spyOn(repo, "setActive").mockRejectedValueOnce(new Error("boom"));
    const { result } = renderHook(() => useActivityTypesEditor(), {
      wrapper: wrapperFor(repo),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    const tipo = result.current.active[0]!;
    await act(async () => {
      await result.current.toggleActive(tipo);
    });
    expect(result.current.globalError).toBe("Operazione non riuscita.");
    expect(result.current.busyId).toBeNull();
  });

  it("clears the global error on demand", async () => {
    const repo = await seedRepo();
    const { result } = renderHook(() => useActivityTypesEditor(), {
      wrapper: wrapperFor(repo),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    const tipo = result.current.active[0]!;
    await act(async () => {
      await result.current.saveTariffa(tipo, "-3");
    });
    expect(result.current.globalError).not.toBeNull();
    act(() => result.current.clearError());
    expect(result.current.globalError).toBeNull();
  });
});
