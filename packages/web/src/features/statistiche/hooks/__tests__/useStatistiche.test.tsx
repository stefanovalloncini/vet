import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ActorContext, Repositories } from "@vet/shared";
import { RepositoriesProvider } from "../../../../infrastructure/RepositoriesContext";
import { createInMemoryRepositories } from "../../../../infrastructure/composition/in-memory";
import { useStatistiche } from "../useStatistiche";

const actor: ActorContext = {
  uid: "vet-1",
  email: "vet@example.com",
  displayName: "Dr Rossi",
  roleId: "vet",
  caps: new Set(),
  approved: true,
};

const NOW = new Date(2026, 4, 15, 12, 0, 0);

async function seedAttivita(
  repos: Repositories,
  data: Date,
  totale: number,
  aziendaId: string,
  aziendaNome: string,
  tipoId = "visita",
  tipoNome = "Visita"
) {
  await repos.attivita.create(
    { data, aziendaId, tipoId, oraria: false, tariffa: totale },
    { aziendaNome, tipoNome },
    actor
  );
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function wrap(repos: Repositories) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const client = createTestQueryClient();
    return (
      <QueryClientProvider client={client}>
        <RepositoriesProvider value={repos}>{children}</RepositoriesProvider>
      </QueryClientProvider>
    );
  };
}

describe("useStatistiche", () => {
  it("resolves with empty buckets when no data", async () => {
    const repos = createInMemoryRepositories();
    const { result } = renderHook(() => useStatistiche("12m", NOW), {
      wrapper: wrap(repos),
    });
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isError).toBe(false);
    expect(result.current.items).toEqual([]);
    expect(result.current.byTipo).toEqual([]);
    expect(result.current.topClients).toEqual([]);
    expect(result.current.totalRange).toBe(0);
    expect(result.current.yoyDiff).toBeNull();
    expect(result.current.stackedMonths).toHaveLength(12);
  });

  it("aggregates byTipo and topClients across the 12-month range", async () => {
    const repos = createInMemoryRepositories();
    const a1 = await repos.aziende.create({ nome: "Demo A" }, actor);
    const a2 = await repos.aziende.create({ nome: "Demo B" }, actor);
    await seedAttivita(repos, new Date(2026, 3, 5), 100, a1, "Demo A", "visita", "Visita");
    await seedAttivita(repos, new Date(2026, 3, 10), 200, a1, "Demo A", "visita", "Visita");
    await seedAttivita(repos, new Date(2026, 3, 20), 50, a2, "Demo B", "controllo", "Controllo");

    const { result } = renderHook(() => useStatistiche("12m", NOW), {
      wrapper: wrap(repos),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.totalRange).toBeCloseTo(350, 2);
    expect(result.current.byTipo[0]?.label).toBe("Visita");
    expect(result.current.byTipo[0]?.value).toBeCloseTo(300, 2);
    expect(result.current.topClients[0]?.label).toBe("Demo A");
    expect(result.current.topClients[0]?.count).toBe(2);
  });

  it("computes monthlyComparison vs last year and yoyDiff", async () => {
    const repos = createInMemoryRepositories();
    const aziendaId = await repos.aziende.create({ nome: "Demo" }, actor);
    await seedAttivita(repos, new Date(2026, 2, 5), 200, aziendaId, "Demo");
    await seedAttivita(repos, new Date(2025, 2, 5), 100, aziendaId, "Demo");

    const { result } = renderHook(() => useStatistiche("ytd", NOW), {
      wrapper: wrap(repos),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.monthlyComparison.thisYear[2]).toBeCloseTo(200, 2);
    expect(result.current.monthlyComparison.lastYear[2]).toBeCloseTo(100, 2);
    expect(result.current.totalLastYear).toBeCloseTo(100, 2);
    expect(result.current.yoyDiff).toBe(100);
  });

  it("includes funnel stages and aziende from the repository", async () => {
    const repos = createInMemoryRepositories();
    const aziendaId = await repos.aziende.create(
      { nome: "Demo", cadenzaFatturazione: "monthly" },
      actor
    );
    await seedAttivita(repos, new Date(2026, 3, 5), 100, aziendaId, "Demo");

    const { result } = renderHook(() => useStatistiche("12m", NOW), {
      wrapper: wrap(repos),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.funnel).toHaveLength(3);
    expect(result.current.funnel[0]?.value).toBe(1);
    expect(result.current.funnel[1]?.value).toBe(1);
    expect(result.current.aziende.length).toBe(1);
  });
});
