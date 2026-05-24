import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { InMemoryAttivitaRepository } from "@vet/shared/testing";
import type { ActorContext, Repositories } from "@vet/shared";
import { RepositoriesProvider } from "../../../../infrastructure/RepositoriesContext";
import {
  useAttivita,
  useCreateAttivita,
  useSoftDeleteAttivita,
  useUpdateAttivita,
} from "../useAttivita";

const actor: ActorContext = {
  uid: "u1",
  email: "vet@example.com",
  displayName: "Vet One",
  roleId: "vet",
  caps: new Set(["activities.create"]),
  approved: true,
};

const denorm = { aziendaNome: "Cascina", tipoNome: "Visita" };

function buildWrapper(attivita: InMemoryAttivitaRepository) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const repos = { attivita } as unknown as Repositories;
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <RepositoriesProvider value={repos}>{children}</RepositoriesProvider>
      </QueryClientProvider>
    );
  };
}

describe("useAttivita", () => {
  it("returns seeded items once the query resolves", async () => {
    const repo = new InMemoryAttivitaRepository();
    await repo.create(
      {
        data: new Date("2026-05-10"),
        aziendaId: "az1",
        tipoId: "tp1",
        oraria: false, adElemento: false,
        tariffa: 80,
      },
      denorm,
      actor
    );
    const { result } = renderHook(() => useAttivita(), {
      wrapper: buildWrapper(repo),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.data?.[0]?.tariffa).toBe(80);
    expect(result.current.isError).toBe(false);
  });
});

describe("useCreateAttivita", () => {
  it("invalidates the list so a subsequent useAttivita refetches", async () => {
    const repo = new InMemoryAttivitaRepository();
    const wrapper = buildWrapper(repo);
    const list = renderHook(() => useAttivita(), { wrapper });
    const create = renderHook(() => useCreateAttivita(), { wrapper });
    await waitFor(() => expect(list.result.current.isLoading).toBe(false));
    expect(list.result.current.items).toHaveLength(0);

    await create.result.current.mutateAsync({
      input: {
        data: new Date("2026-05-11"),
        aziendaId: "az1",
        tipoId: "tp1",
        oraria: false, adElemento: false,
        tariffa: 100,
      },
      denorm,
      actor,
    });

    await waitFor(() => expect(list.result.current.items.length).toBe(1));
    expect(list.result.current.items[0]?.tariffa).toBe(100);
  });
});

describe("useUpdateAttivita", () => {
  it("reflects the new tariffa in the list after invalidation", async () => {
    const repo = new InMemoryAttivitaRepository();
    const id = await repo.create(
      {
        data: new Date("2026-05-10"),
        aziendaId: "az1",
        tipoId: "tp1",
        oraria: false, adElemento: false,
        tariffa: 80,
      },
      denorm,
      actor
    );
    const wrapper = buildWrapper(repo);
    const list = renderHook(() => useAttivita(), { wrapper });
    const update = renderHook(() => useUpdateAttivita(), { wrapper });
    await waitFor(() => expect(list.result.current.items.length).toBe(1));

    await update.result.current.mutateAsync({
      id,
      input: {
        data: new Date("2026-05-10"),
        aziendaId: "az1",
        tipoId: "tp1",
        oraria: false, adElemento: false,
        tariffa: 150,
      },
      denorm,
      actor,
    });

    await waitFor(() =>
      expect(list.result.current.items[0]?.tariffa).toBe(150)
    );
  });
});

describe("useSoftDeleteAttivita", () => {
  it("removes the soft-deleted entry from the list", async () => {
    const repo = new InMemoryAttivitaRepository();
    const id = await repo.create(
      {
        data: new Date("2026-05-10"),
        aziendaId: "az1",
        tipoId: "tp1",
        oraria: false, adElemento: false,
        tariffa: 80,
      },
      denorm,
      actor
    );
    const wrapper = buildWrapper(repo);
    const list = renderHook(() => useAttivita(), { wrapper });
    const del = renderHook(() => useSoftDeleteAttivita(), { wrapper });
    await waitFor(() => expect(list.result.current.items.length).toBe(1));

    await del.result.current.mutateAsync({ id, actor });

    await waitFor(() => expect(list.result.current.items.length).toBe(0));
  });
});
