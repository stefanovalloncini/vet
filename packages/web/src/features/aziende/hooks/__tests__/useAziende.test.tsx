import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { InMemoryAziendeRepository } from "@vet/shared/testing";
import type { ActorContext, Repositories } from "@vet/shared";
import { RepositoriesProvider } from "../../../../infrastructure/RepositoriesContext";
import {
  useAziende,
  useCreateAzienda,
  useDeleteAzienda,
  useUpdateAzienda,
} from "../useAziende";

const actor: ActorContext = {
  uid: "u1",
  email: "tester@example.com",
  displayName: "Tester",
  roleId: "vet",
  caps: new Set(["aziende.create", "aziende.update"]),
  approved: true,
};

function buildWrapper(aziende: InMemoryAziendeRepository) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const repos = { aziende } as unknown as Repositories;
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <RepositoriesProvider value={repos}>{children}</RepositoriesProvider>
      </QueryClientProvider>
    );
  };
}

describe("useAziende", () => {
  it("returns the list once the query resolves", async () => {
    const repo = new InMemoryAziendeRepository();
    await repo.create({ nome: "Cascina Uno" }, actor);
    await repo.create({ nome: "Cascina Due" }, actor);
    const { result } = renderHook(() => useAziende(), {
      wrapper: buildWrapper(repo),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toHaveLength(2);
    expect(result.current.isError).toBe(false);
  });
});

describe("useCreateAzienda", () => {
  it("invalidates the list query so a subsequent useAziende refetches", async () => {
    const repo = new InMemoryAziendeRepository();
    const wrapper = buildWrapper(repo);
    const list = renderHook(() => useAziende(), { wrapper });
    const create = renderHook(() => useCreateAzienda(), { wrapper });
    await waitFor(() => expect(list.result.current.isLoading).toBe(false));
    expect(list.result.current.data).toHaveLength(0);

    await create.result.current.mutateAsync({
      input: { nome: "Cascina Tre" },
      actor,
    });

    await waitFor(() => expect(list.result.current.data?.length).toBe(1));
    expect(list.result.current.data?.[0]?.nome).toBe("Cascina Tre");
  });
});

describe("useUpdateAzienda", () => {
  it("reflects the new name in the list query after invalidation", async () => {
    const repo = new InMemoryAziendeRepository();
    const id = await repo.create({ nome: "Vecchio Nome" }, actor);
    const wrapper = buildWrapper(repo);
    const list = renderHook(() => useAziende(), { wrapper });
    const update = renderHook(() => useUpdateAzienda(), { wrapper });
    await waitFor(() => expect(list.result.current.data?.length).toBe(1));

    await update.result.current.mutateAsync({
      id,
      input: { nome: "Nuovo Nome" },
      actor,
    });

    await waitFor(() =>
      expect(list.result.current.data?.[0]?.nome).toBe("Nuovo Nome")
    );
  });
});

describe("useDeleteAzienda", () => {
  it("removes the soft-deleted entry from the list query", async () => {
    const repo = new InMemoryAziendeRepository();
    const id = await repo.create({ nome: "Da Cestinare" }, actor);
    const wrapper = buildWrapper(repo);
    const list = renderHook(() => useAziende(), { wrapper });
    const del = renderHook(() => useDeleteAzienda(), { wrapper });
    await waitFor(() => expect(list.result.current.data?.length).toBe(1));

    await del.result.current.mutateAsync({ id, actor });

    await waitFor(() => expect(list.result.current.data?.length).toBe(0));
  });
});
