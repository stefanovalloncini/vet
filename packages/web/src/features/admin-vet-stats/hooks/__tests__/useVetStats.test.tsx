import { renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import type { ReactNode } from "react";
import type { ActorContext, Repositories } from "@vet/shared";
import { createInMemoryRepositories } from "../../../../infrastructure/composition/in-memory";
import { RepositoriesProvider } from "../../../../infrastructure/RepositoriesContext";
import { createQueryClient } from "../../../../shared/data/queryClient";
import { useVetStats } from "../useVetStats";

function wrapWith(repos: Repositories) {
  const client = createQueryClient();
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <RepositoriesProvider value={repos}>{children}</RepositoriesProvider>
    </QueryClientProvider>
  );
}

function makeActor(overrides: Partial<ActorContext> = {}): ActorContext {
  return {
    uid: "vet-1",
    email: "vet1@example.com",
    displayName: "Vet One",
    roleId: "vet",
    caps: new Set<never>(),
    approved: true,
    ...overrides,
  };
}

async function seedActivity(
  repos: Repositories,
  actor: ActorContext,
  data: Date,
  tariffa: number
): Promise<void> {
  const aziendaId = await repos.aziende.create({ nome: "Az A" }, actor);
  await repos.activityTypes.upsert("visita", {
    nome: "Visita",
    ordine: 10,
    attivo: true,
  });
  await repos.attivita.create(
    { data, aziendaId, tipoId: "visita", oraria: false, adElemento: false, tariffa },
    { aziendaNome: "Az A", tipoNome: "Visita" },
    actor
  );
}

describe("useVetStats", () => {
  it("aggregates totals per owner and sorts by total desc", async () => {
    const repos = createInMemoryRepositories();
    const v1 = makeActor();
    const v2 = makeActor({
      uid: "vet-2",
      email: "vet2@example.com",
      displayName: "Vet Two",
    });
    await seedActivity(repos, v1, new Date("2026-05-10"), 50);
    await seedActivity(repos, v1, new Date("2026-05-11"), 80);
    await seedActivity(repos, v2, new Date("2026-05-12"), 200);

    const { result } = renderHook(() => useVetStats(), {
      wrapper: wrapWith(repos),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0]?.uid).toBe("vet-2");
    expect(result.current.data?.[0]?.total).toBe(200);
    expect(result.current.data?.[0]?.count).toBe(1);
    expect(result.current.data?.[1]?.uid).toBe("vet-1");
    expect(result.current.data?.[1]?.total).toBe(130);
    expect(result.current.data?.[1]?.count).toBe(2);
  });

  it("returns an empty list when there are no activities", async () => {
    const repos = createInMemoryRepositories();
    const { result } = renderHook(() => useVetStats(), {
      wrapper: wrapWith(repos),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isError).toBe(false);
    expect(result.current.data).toEqual([]);
  });

  it("respects from/to filters", async () => {
    const repos = createInMemoryRepositories();
    const v1 = makeActor();
    await seedActivity(repos, v1, new Date("2026-01-10"), 50);
    await seedActivity(repos, v1, new Date("2026-05-10"), 80);

    const { result } = renderHook(
      () =>
        useVetStats({
          from: new Date("2026-05-01"),
          to: new Date("2026-05-31"),
        }),
      { wrapper: wrapWith(repos) }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0]?.total).toBe(80);
    expect(result.current.data?.[0]?.count).toBe(1);
  });
});
