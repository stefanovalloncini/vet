import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ActorContext, Repositories } from "@vet/shared";
import { RepositoriesProvider } from "../../../../infrastructure/RepositoriesContext";
import { createInMemoryRepositories } from "../../../../infrastructure/composition/in-memory";
import { useDashboardStats } from "../useDashboardStats";

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

describe("useDashboardStats", () => {
  it("starts loading and resolves to empty arrays when no data", async () => {
    const repos = createInMemoryRepositories();
    const { result } = renderHook(() => useDashboardStats(NOW), {
      wrapper: wrap(repos),
    });
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isError).toBe(false);
    expect(result.current.items).toEqual([]);
    expect(result.current.aziende).toEqual([]);
    expect(result.current.thisMonth.total).toBe(0);
    expect(result.current.arrearsTotal).toBe(0);
  });

  it("computes this-month and last-month totals from seeded attivita", async () => {
    const repos = createInMemoryRepositories();
    const aziendaId = await repos.aziende.create({ nome: "Allevamento Demo" }, actor);
    await seedAttivita(repos, new Date(2026, 4, 5), 100, aziendaId, "Allevamento Demo");
    await seedAttivita(repos, new Date(2026, 4, 12), 80, aziendaId, "Allevamento Demo");
    await seedAttivita(repos, new Date(2026, 3, 20), 60, aziendaId, "Allevamento Demo");

    const { result } = renderHook(() => useDashboardStats(NOW), {
      wrapper: wrap(repos),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.thisMonth.total).toBeCloseTo(180, 2);
    expect(result.current.thisMonth.count).toBe(2);
    expect(result.current.lastMonth.total).toBeCloseTo(60, 2);
    expect(result.current.totalDiff).toBe(200);
  });

  it("produces topAzienda and topTipo bars from the current month", async () => {
    const repos = createInMemoryRepositories();
    const a1 = await repos.aziende.create({ nome: "Demo A" }, actor);
    const a2 = await repos.aziende.create({ nome: "Demo B" }, actor);
    await seedAttivita(repos, new Date(2026, 4, 5), 300, a1, "Demo A", "visita", "Visita");
    await seedAttivita(repos, new Date(2026, 4, 8), 100, a2, "Demo B", "controllo", "Controllo");
    await seedAttivita(repos, new Date(2026, 4, 10), 50, a2, "Demo B", "visita", "Visita");

    const { result } = renderHook(() => useDashboardStats(NOW), {
      wrapper: wrap(repos),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.topAzienda?.value.nome).toBe("Demo A");
    expect(result.current.topTipo?.value.nome).toBe("Visita");
    expect(result.current.topTipoBars.length).toBeGreaterThan(0);
  });

  it("returns recentAziende from in-range attivita", async () => {
    const repos = createInMemoryRepositories();
    const aziendaId = await repos.aziende.create({ nome: "Allevamento Demo" }, actor);
    await seedAttivita(repos, new Date(2026, 4, 5), 100, aziendaId, "Allevamento Demo");

    const { result } = renderHook(() => useDashboardStats(NOW), {
      wrapper: wrap(repos),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.recentAziende.length).toBeGreaterThan(0);
    expect(result.current.recentAziende[0]?.nome).toBe("Allevamento Demo");
  });

  it("provides the trailing twelve months structure", async () => {
    const repos = createInMemoryRepositories();
    const { result } = renderHook(() => useDashboardStats(NOW), {
      wrapper: wrap(repos),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.trailing.totals).toHaveLength(12);
    expect(result.current.trailing.labels).toHaveLength(12);
  });
});
