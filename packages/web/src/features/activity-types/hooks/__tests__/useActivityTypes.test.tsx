import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { InMemoryActivityTypesRepository } from "@vet/shared/testing";
import type { Repositories } from "@vet/shared";
import { RepositoriesProvider } from "../../../../infrastructure/RepositoriesContext";
import {
  useCreateTipoAttivita,
  useSaveTipoTariffa,
  useTipiAttivita,
  useToggleTipoAttivitaActive,
} from "../useActivityTypes";

function makeRepos(repo: InMemoryActivityTypesRepository): Repositories {
  return { activityTypes: repo } as unknown as Repositories;
}

function wrapperFor(repo: InMemoryActivityTypesRepository) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <RepositoriesProvider value={makeRepos(repo)}>
          {children}
        </RepositoriesProvider>
      </QueryClientProvider>
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
  return repo;
}

describe("useTipiAttivita", () => {
  it("returns the list from the repository", async () => {
    const repo = await seedRepo();
    const { result } = renderHook(() => useTipiAttivita(), {
      wrapper: wrapperFor(repo),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0]?.id).toBe("visita");
  });
});

function combined() {
  return {
    list: useTipiAttivita(),
    create: useCreateTipoAttivita(),
    toggle: useToggleTipoAttivitaActive(),
    tariffa: useSaveTipoTariffa(),
  };
}

describe("activity types mutations", () => {
  it("create then list reflects the new item", async () => {
    const repo = new InMemoryActivityTypesRepository();
    const { result } = renderHook(combined, { wrapper: wrapperFor(repo) });
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true));
    expect(result.current.list.data).toHaveLength(0);
    await act(async () => {
      await result.current.create.mutateAsync({
        id: "cesareo",
        input: { nome: "Cesareo", ordine: 10, attivo: true },
      });
    });
    await waitFor(() =>
      expect(
        result.current.list.data?.some((t) => t.id === "cesareo")
      ).toBe(true)
    );
  });

  it("toggle flips active flag and refetches", async () => {
    const repo = await seedRepo();
    const { result } = renderHook(combined, { wrapper: wrapperFor(repo) });
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true));
    await act(async () => {
      await result.current.toggle.mutateAsync({ id: "visita", attivo: false });
    });
    await waitFor(() =>
      expect(result.current.list.data?.[0]?.attivo).toBe(false)
    );
  });

  it("save tariffa persists number and clears with null", async () => {
    const repo = await seedRepo();
    const { result } = renderHook(combined, { wrapper: wrapperFor(repo) });
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true));
    await act(async () => {
      await result.current.tariffa.mutateAsync({ id: "visita", tariffa: 42 });
    });
    await waitFor(() =>
      expect(result.current.list.data?.[0]?.tariffaStandard).toBe(42)
    );
    await act(async () => {
      await result.current.tariffa.mutateAsync({
        id: "visita",
        tariffa: null,
      });
    });
    await waitFor(() =>
      expect(result.current.list.data?.[0]?.tariffaStandard).toBeUndefined()
    );
  });
});
