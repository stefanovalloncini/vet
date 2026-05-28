import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type {
  ActorContext,
  Capability,
  Conto,
  Repositories,
} from "@vet/shared";
import { InMemoryAuthService } from "@vet/shared/testing";
import { buildProvidersWrapper } from "../../../../__tests__/renderWithProviders";
import { ContiPerAziendaTab } from "../ContiPerAziendaTab";

function actor(caps: Capability[] = []): ActorContext {
  return {
    uid: "vet-1",
    email: "vet@example.com",
    displayName: "Vet One",
    roleId: "vet",
    caps: new Set(caps),
    approved: true,
  };
}

function conto(over: Partial<Conto> = {}): Conto {
  const base: Conto = {
    id: "c1",
    aziendaId: "az1",
    aziendaNome: "Cascina Verdi",
    periodoFrom: new Date("2026-01-01T00:00:00Z"),
    periodoTo: new Date("2026-03-31T23:59:59Z"),
    modalita: "emesso",
    saldato: false,
    totaleConto: 250,
    attivitaIds: ["a1", "a2"],
    emittedAt: new Date("2026-04-01T09:00:00Z"),
    emittedBy: "vet-1",
    emittedByName: "Vet One",
    isDeleted: false,
    schemaVersion: 1,
  };
  return { ...base, ...over };
}

function reposWith(
  caps: Capability[],
  listForAzienda: () => Promise<Conto[]>
): Repositories {
  const auth = new InMemoryAuthService();
  auth.setSimulatedUser(actor(caps));
  return {
    auth,
    conti: { listForAzienda },
  } as unknown as Repositories;
}

describe("ContiPerAziendaTab", () => {
  it("shows a loading skeleton while conti are pending", () => {
    const repos = reposWith([], () => new Promise<Conto[]>(() => {}));
    const { container } = render(<ContiPerAziendaTab aziendaId="az1" />, {
      wrapper: buildProvidersWrapper({ repos }),
    });
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0
    );
  });

  it("shows the empty state when the azienda has no conti", async () => {
    const repos = reposWith([], () => Promise.resolve([]));
    render(<ContiPerAziendaTab aziendaId="az1" />, {
      wrapper: buildProvidersWrapper({ repos }),
    });
    await waitFor(() =>
      expect(screen.getByText(/Nessun conto emesso/i)).toBeInTheDocument()
    );
  });

  it("surfaces an error region when the query fails", async () => {
    const repos = reposWith([], () => Promise.reject(new Error("boom")));
    render(<ContiPerAziendaTab aziendaId="az1" />, {
      wrapper: buildProvidersWrapper({ repos }),
    });
    await waitFor(() =>
      expect(screen.getByRole("alert")).toBeInTheDocument()
    );
  });

  it("renders a single labelled status badge per conto", async () => {
    const repos = reposWith([], () =>
      Promise.resolve([conto({ saldato: false })])
    );
    render(<ContiPerAziendaTab aziendaId="az1" />, {
      wrapper: buildProvidersWrapper({ repos }),
    });
    await waitFor(() =>
      expect(screen.getByText("Non saldato")).toBeInTheDocument()
    );
  });

  it("exposes a 44px saldo action for users with the saldo cap", async () => {
    const repos = reposWith(["conti.saldo"], () =>
      Promise.resolve([conto({ saldato: false })])
    );
    render(<ContiPerAziendaTab aziendaId="az1" />, {
      wrapper: buildProvidersWrapper({ repos, withToast: true }),
    });
    const btn = await screen.findByRole("button", { name: /Segna saldato/i });
    expect(btn.className).toContain("h-11");
  });

  it("does not crash on a very large total", async () => {
    const repos = reposWith([], () =>
      Promise.resolve([conto({ totaleConto: 1234567.89 })])
    );
    render(<ContiPerAziendaTab aziendaId="az1" />, {
      wrapper: buildProvidersWrapper({ repos }),
    });
    await waitFor(() =>
      expect(screen.getByText(/1\.234\.567,89/)).toBeInTheDocument()
    );
  });
});
