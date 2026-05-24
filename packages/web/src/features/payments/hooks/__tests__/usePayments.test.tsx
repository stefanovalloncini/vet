import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ActorContext, Repositories } from "@vet/shared";
import { createInMemoryRepositories } from "../../../../infrastructure/composition/in-memory";
import { RepositoriesProvider } from "../../../../infrastructure/RepositoriesContext";
import {
  useCreatePayment,
  useDeletePayment,
  usePayments,
} from "../usePayments";

const actor: ActorContext = {
  uid: "u1",
  email: "u@x.it",
  displayName: "U",
  roleId: "vet",
  caps: new Set(["payments.manage"]),
  approved: true,
};

function wrap(repos: Repositories) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <RepositoriesProvider value={repos}>{children}</RepositoriesProvider>
    </QueryClientProvider>
  );
}

async function seedAzienda(repos: Repositories): Promise<string> {
  return repos.aziende.create({ nome: "Cascina A" }, actor);
}

describe("usePayments", () => {
  it("loads payments via tanstack query", async () => {
    const repos = createInMemoryRepositories();
    await seedAzienda(repos);

    const { result } = renderHook(() => usePayments(), {
      wrapper: wrap(repos),
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.data).toEqual([]);
    expect(result.current.isError).toBe(false);
  });

  it("returns undefined before data resolves", () => {
    const repos = createInMemoryRepositories();
    const { result } = renderHook(() => usePayments(), {
      wrapper: wrap(repos),
    });
    expect(result.current.data).toBeUndefined();
  });
});

describe("useCreatePayment", () => {
  it("creates a payment and invalidates the payments list", async () => {
    const repos = createInMemoryRepositories();
    const aziendaId = await seedAzienda(repos);
    const wrapper = wrap(repos);

    const { result: listResult } = renderHook(() => usePayments(), {
      wrapper,
    });
    await waitFor(() => expect(listResult.current.isPending).toBe(false));
    expect(listResult.current.data).toHaveLength(0);

    const { result: createResult } = renderHook(() => useCreatePayment(), {
      wrapper,
    });
    await act(async () => {
      await createResult.current.mutateAsync({
        input: {
          aziendaId,
          periodoFinoA: new Date("2026-04-30"),
          importoPagato: 200,
        },
        denorm: { aziendaNome: "Cascina A" },
        actor,
      });
    });

    await waitFor(() =>
      expect(listResult.current.data).toHaveLength(1)
    );
  });
});

describe("useDeletePayment", () => {
  it("deletes a payment and invalidates the list", async () => {
    const repos = createInMemoryRepositories();
    const aziendaId = await seedAzienda(repos);
    const id = await repos.payments.create(
      { aziendaId, periodoFinoA: new Date("2026-04-30"), importoPagato: 100 },
      { aziendaNome: "Cascina A" },
      actor
    );
    const wrapper = wrap(repos);

    const { result: listResult } = renderHook(() => usePayments(), {
      wrapper,
    });
    await waitFor(() => expect(listResult.current.isPending).toBe(false));
    expect(listResult.current.data).toHaveLength(1);

    const { result: deleteResult } = renderHook(() => useDeletePayment(), {
      wrapper,
    });
    await act(async () => {
      await deleteResult.current.mutateAsync({ id, actor });
    });
    await waitFor(() =>
      expect(listResult.current.data).toHaveLength(0)
    );
  });
});
