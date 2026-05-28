import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  InMemoryAttivitaRepository,
} from "@vet/shared/testing";
import type {
  ActorContext,
  Attivita,
  AttivitaRepository,
  Repositories,
} from "@vet/shared";
import { RepositoriesProvider } from "../../../../infrastructure/RepositoriesContext";
import { useUndoCreateAttivita } from "../useUndoCreateAttivita";

function actor(): ActorContext {
  return {
    uid: "vet-1",
    email: "vet@example.com",
    displayName: "Vet One",
    roleId: "vet",
    caps: new Set(),
    approved: true,
  };
}

function fakeAttivita(id: string): Attivita {
  return {
    id,
    data: new Date("2026-05-01"),
    aziendaId: "az-1",
    aziendaNome: "Cliente Uno",
    tipoId: "visita",
    tipoNome: "Visita",
    oraria: false, adElemento: false,
    tariffa: 30,
    totale: 30,
    ownerUid: "vet-1",
    ownerEmail: "vet@example.com",
    ownerName: "Vet One",
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false,
    schemaVersion: 1,
  };
}

function buildWrapper(repo: AttivitaRepository) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const repos = { attivita: repo } as unknown as Repositories;
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <RepositoriesProvider value={repos}>{children}</RepositoriesProvider>
      </QueryClientProvider>
    );
  }
  return { Wrapper, client };
}

describe("useUndoCreateAttivita", () => {
  it("optimistically removes the item from cached lists", async () => {
    const repo = new InMemoryAttivitaRepository();
    const { Wrapper, client } = buildWrapper(repo);
    const seeded = [fakeAttivita("a-1"), fakeAttivita("a-2")];
    client.setQueryData(["attivita", {}], seeded);

    const { result } = renderHook(() => useUndoCreateAttivita(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({ id: "a-1", user: actor() });
    });

    const cached = client.getQueryData<Attivita[]>(["attivita", {}]);
    expect(cached?.some((a) => a.id === "a-1")).toBe(false);
    expect(cached?.some((a) => a.id === "a-2")).toBe(true);
  });

  it("leaves non-array caches (byId / lastByAziendaTipo) intact", async () => {
    const repo = new InMemoryAttivitaRepository();
    const { Wrapper, client } = buildWrapper(repo);
    client.setQueryData(
      ["attivita", {}],
      [fakeAttivita("a-1"), fakeAttivita("a-2")]
    );
    const single = fakeAttivita("a-1");
    client.setQueryData(
      ["attivita", "lastByAziendaTipo", "az-1", "visita"],
      single
    );
    client.setQueryData(["attivita", "byId", "a-1"], single);

    const { result } = renderHook(() => useUndoCreateAttivita(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({ id: "a-1", user: actor() });
    });

    const list = client.getQueryData<Attivita[]>(["attivita", {}]);
    expect(list?.some((a) => a.id === "a-1")).toBe(false);
    expect(
      client.getQueryData(["attivita", "lastByAziendaTipo", "az-1", "visita"])
    ).toEqual(single);
    expect(client.getQueryData(["attivita", "byId", "a-1"])).toEqual(single);
  });

  it("rolls back the cache when the mutation fails", async () => {
    const repo = new InMemoryAttivitaRepository();
    const failing: AttivitaRepository = {
      ...repo,
      list: (filters) => repo.list(filters),
      listDeleted: (filters) => repo.listDeleted(filters),
      getById: (id) => repo.getById(id),
      findLastByAziendaAndTipo: (a, t) => repo.findLastByAziendaAndTipo(a, t),
      create: (i, d, a) => repo.create(i, d, a),
      update: (id, i, d, a) => repo.update(id, i, d, a),
      softDelete: async () => {
        throw new Error("boom");
      },
      restore: (id) => repo.restore(id),
      hardDelete: (id) => repo.hardDelete(id),
      purgeOlderThanDeletedAt: (c) => repo.purgeOlderThanDeletedAt(c),
      deleteAllForOwner: (o) => repo.deleteAllForOwner(o),
    };
    const { Wrapper, client } = buildWrapper(failing);
    const seeded = [fakeAttivita("a-1"), fakeAttivita("a-2")];
    client.setQueryData(["attivita", {}], seeded);

    const { result } = renderHook(() => useUndoCreateAttivita(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current
        .mutateAsync({ id: "a-1", user: actor() })
        .catch(() => undefined);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    const cached = client.getQueryData<Attivita[]>(["attivita", {}]);
    expect(cached?.map((a) => a.id)).toEqual(["a-1", "a-2"]);
  });

  it("invalidates the attivita queries on settle", async () => {
    const repo = new InMemoryAttivitaRepository();
    const { id } = await repo.create(
      {
        data: new Date("2026-05-01"),
        aziendaId: "az-1",
        tipoId: "visita",
        oraria: false, adElemento: false,
        tariffa: 30,
      },
      { aziendaNome: "Cliente Uno", tipoNome: "Visita" },
      actor()
    );
    const { Wrapper, client } = buildWrapper(repo);
    client.setQueryData(["attivita", {}], await repo.list());

    const { result } = renderHook(() => useUndoCreateAttivita(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({ id, user: actor() });
    });

    await waitFor(() => {
      const cached = client.getQueryData<Attivita[]>(["attivita", {}]);
      expect(cached?.length).toBe(0);
    });
  });
});
