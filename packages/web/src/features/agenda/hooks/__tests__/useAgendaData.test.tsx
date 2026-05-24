import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect } from "vitest";
import type { ReactNode } from "react";
import type { Repositories } from "@vet/shared";
import { createInMemoryRepositories } from "../../../../infrastructure/composition/in-memory";
import { RepositoriesProvider } from "../../../../infrastructure/RepositoriesContext";
import { useAgendaData } from "../useAgendaData";

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

async function seed(repos: Repositories, dates: Date[]): Promise<void> {
  const actor = {
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
  for (const data of dates) {
    await repos.attivita.create(
      { data, aziendaId, tipoId: "visita", oraria: false, adElemento: false, tariffa: 50 },
      { aziendaNome: "Azienda A", tipoNome: "Visita" },
      actor
    );
  }
}

describe("useAgendaData", () => {
  it("computes month range from the selected date", () => {
    const repos = createInMemoryRepositories();
    const selectedDate = new Date(2026, 4, 15);
    const { result } = renderHook(
      () => useAgendaData({ selectedDate, viewMode: "month" }),
      { wrapper: wrapWith(repos) }
    );
    expect(result.current.rangeStart.getFullYear()).toBe(2026);
    expect(result.current.rangeStart.getMonth()).toBe(4);
    expect(result.current.rangeStart.getDate()).toBe(1);
    expect(result.current.rangeEnd.getMonth()).toBe(4);
    expect(result.current.rangeEnd.getDate()).toBe(31);
  });

  it("computes week range starting on Monday", () => {
    const repos = createInMemoryRepositories();
    const wednesday = new Date(2026, 4, 20);
    const { result } = renderHook(
      () => useAgendaData({ selectedDate: wednesday, viewMode: "week" }),
      { wrapper: wrapWith(repos) }
    );
    expect(result.current.rangeStart.getDay()).toBe(1);
    expect(result.current.rangeStart.getDate()).toBe(18);
    expect(result.current.rangeEnd.getDate()).toBe(24);
  });

  it("loads attivita inside the month range and exposes empty reminders", async () => {
    const repos = createInMemoryRepositories();
    await seed(repos, [
      new Date(2026, 4, 5),
      new Date(2026, 4, 20),
      new Date(2026, 5, 2),
    ]);
    const selectedDate = new Date(2026, 4, 10);
    const { result } = renderHook(
      () => useAgendaData({ selectedDate, viewMode: "month" }),
      { wrapper: wrapWith(repos) }
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toHaveLength(2);
    expect(result.current.reminders).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("exposes refresh as a callable function", async () => {
    const repos = createInMemoryRepositories();
    const selectedDate = new Date(2026, 4, 15);
    const { result } = renderHook(
      () => useAgendaData({ selectedDate, viewMode: "month" }),
      { wrapper: wrapWith(repos) }
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(typeof result.current.refresh).toBe("function");
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.error).toBeNull();
  });
});
