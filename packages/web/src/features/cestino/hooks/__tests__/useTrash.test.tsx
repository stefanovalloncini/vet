import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import type { ReactNode } from "react";
import type { ActorContext, Repositories } from "@vet/shared";
import { createInMemoryRepositories } from "../../../../infrastructure/composition/in-memory";
import { RepositoriesProvider } from "../../../../infrastructure/RepositoriesContext";
import { usePurgeTrashed, useRestoreTrashed, useTrash } from "../useTrash";

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}

function wrapWith(repos: Repositories) {
  const client = makeQueryClient();
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <RepositoriesProvider value={repos}>{children}</RepositoriesProvider>
    </QueryClientProvider>
  );
}

async function seedDeleted(repos: Repositories): Promise<{
  actor: ActorContext;
  id: string;
}> {
  const actor: ActorContext = {
    uid: "u1",
    email: "u@x.it",
    displayName: "U",
    roleId: "vet",
    caps: new Set<never>(),
    approved: true,
  };
  const aziendaId = await repos.aziende.create({ nome: "Azienda A" }, actor);
  await repos.activityTypes.upsert("visita", {
    nome: "Visita",
    ordine: 10,
    attivo: true,
  });
  const id = await repos.attivita.create(
    {
      data: new Date(2026, 4, 10),
      aziendaId,
      tipoId: "visita",
      oraria: false,
      tariffa: 50,
    },
    { aziendaNome: "Azienda A", tipoNome: "Visita" },
    actor
  );
  await repos.attivita.softDelete(id, actor);
  return { actor, id };
}

describe("useTrash", () => {
  it("loads deleted attivita for the given owner", async () => {
    const repos = createInMemoryRepositories();
    const { actor } = await seedDeleted(repos);
    const { result } = renderHook(
      () => useTrash({ ownerUid: actor.uid }),
      { wrapper: wrapWith(repos) }
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  it("returns empty list when nothing is deleted", async () => {
    const repos = createInMemoryRepositories();
    const { result } = renderHook(
      () => useTrash({}),
      { wrapper: wrapWith(repos) }
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toEqual([]);
  });

  it("refresh refetches the list", async () => {
    const repos = createInMemoryRepositories();
    const { result } = renderHook(
      () => useTrash({}),
      { wrapper: wrapWith(repos) }
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.error).toBeNull();
  });
});

describe("useRestoreTrashed", () => {
  it("restores a soft-deleted attivita", async () => {
    const repos = createInMemoryRepositories();
    const { id } = await seedDeleted(repos);
    const wrapper = wrapWith(repos);
    const { result } = renderHook(() => useRestoreTrashed(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync(id);
    });
    const stillDeleted = await repos.attivita.listDeleted();
    expect(stillDeleted).toHaveLength(0);
  });
});

describe("usePurgeTrashed", () => {
  it("purges a soft-deleted attivita", async () => {
    const repos = createInMemoryRepositories();
    const { id } = await seedDeleted(repos);
    const wrapper = wrapWith(repos);
    const { result } = renderHook(() => usePurgeTrashed(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync(id);
    });
    const after = await repos.attivita.listDeleted();
    expect(after).toHaveLength(0);
    const direct = await repos.attivita.getById(id);
    expect(direct).toBeNull();
  });
});
