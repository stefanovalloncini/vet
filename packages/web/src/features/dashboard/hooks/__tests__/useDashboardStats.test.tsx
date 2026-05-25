import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { InMemoryAttivitaRepository, InMemoryAziendeRepository } from "@vet/shared/testing";
import type { ActorContext, Repositories } from "@vet/shared";
import { RepositoriesProvider } from "../../../../infrastructure/RepositoriesContext";
import { useDashboardStats } from "../useDashboardStats";

const currentUser: ActorContext = {
  uid: "u1",
  email: "u1@vet.com",
  displayName: "Vet One",
  roleId: "vet",
  caps: new Set(["activities.create"]),
  approved: true,
};

const otherUser: ActorContext = {
  uid: "u2",
  email: "u2@vet.com",
  displayName: "Vet Two",
  roleId: "vet",
  caps: new Set(["activities.create"]),
  approved: true,
};

vi.mock("../../../auth", () => ({
  useAuthState: () => ({ loading: false, user: currentUser }),
}));

function buildWrapper(repos: Repositories) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <RepositoriesProvider value={repos}>{children}</RepositoriesProvider>
      </QueryClientProvider>
    );
  };
}

describe("useDashboardStats", () => {
  it("only counts the current user's attività (U3 scoping)", async () => {
    const attivita = new InMemoryAttivitaRepository();
    const denorm = { aziendaNome: "Cascina", tipoNome: "Visita" };
    const now = new Date("2026-05-15T10:00:00Z");

    await attivita.create(
      {
        data: now,
        aziendaId: "az1",
        tipoId: "tp1",
        oraria: false,
        adElemento: false,
        tariffa: 80,
      },
      denorm,
      currentUser
    );
    await attivita.create(
      {
        data: now,
        aziendaId: "az2",
        tipoId: "tp1",
        oraria: false,
        adElemento: false,
        tariffa: 100,
      },
      denorm,
      otherUser
    );
    await attivita.create(
      {
        data: now,
        aziendaId: "az3",
        tipoId: "tp1",
        oraria: false,
        adElemento: false,
        tariffa: 200,
      },
      denorm,
      otherUser
    );

    const repos = {
      attivita,
      aziende: new InMemoryAziendeRepository(),
    } as unknown as Repositories;

    const { result } = renderHook(() => useDashboardStats(now), {
      wrapper: buildWrapper(repos),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.thisMonth.count).toBe(1);
    expect(result.current.thisMonth.total).toBe(80);
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]?.ownerUid).toBe("u1");
  });
});
