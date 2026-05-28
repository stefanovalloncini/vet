import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import type {
  ActorContext,
  Capability,
  Repositories,
} from "@vet/shared";
import {
  InMemoryAttivitaRepository,
  InMemoryAuthService,
  InMemoryAziendeRepository,
  InMemoryContiRepository,
} from "@vet/shared/testing";
import { buildProvidersWrapper } from "../../../__tests__/renderWithProviders";
import { PagamentiPage } from "../ui/PagamentiPage";

vi.mock("../../../shared/ui/AppShell", () => ({
  AppShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

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

describe("PagamentiPage", () => {
  it("filters by stato when the select changes", async () => {
    const auth = new InMemoryAuthService();
    auth.setSimulatedUser(actor(["conti.proforma", "conti.saldo"]));
    const aziende = new InMemoryAziendeRepository();
    const conti = new InMemoryContiRepository();
    const attivita = new InMemoryAttivitaRepository();
    const repos = { auth, aziende, conti, attivita } as unknown as Repositories;

    const a1 = await aziende.create(
      { nome: "Alfa Farm" },
      actor(["aziende.create"])
    );
    const a2 = await aziende.create(
      { nome: "Beta Farm" },
      actor(["aziende.create"])
    );
    // Alfa: unpaid conto.
    await conti.emit(
      {
        aziendaId: a1.id,
        periodoFrom: new Date("2026-01-01"),
        periodoTo: new Date("2026-01-31"),
        modalita: "emesso",
      },
      { aziendaNome: a1.nome, attivitaIds: [], totaleConto: 100 },
      actor()
    );
    // Beta: paid conto.
    const paid = await conti.emit(
      {
        aziendaId: a2.id,
        periodoFrom: new Date("2026-01-01"),
        periodoTo: new Date("2026-01-31"),
        modalita: "emesso",
      },
      { aziendaNome: a2.nome, attivitaIds: [], totaleConto: 50 },
      actor()
    );
    await conti.saldo({ contoId: paid }, actor(["conti.saldo"]));

    render(<PagamentiPage />, {
      wrapper: buildProvidersWrapper({ repos, withRouter: true }),
    });

    // Both aziende appear initially.
    await waitFor(() =>
      expect(screen.getByText("Alfa Farm")).toBeInTheDocument()
    );
    expect(screen.getByText("Beta Farm")).toBeInTheDocument();

    // Filter to "Solo non saldati".
    const select = screen.getByLabelText("Stato") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "unpaid" } });

    await waitFor(() =>
      expect(screen.queryByText("Beta Farm")).not.toBeInTheDocument()
    );
    expect(screen.getByText("Alfa Farm")).toBeInTheDocument();
  });

  it("shows a skeleton while the overview is loading", () => {
    const auth = new InMemoryAuthService();
    auth.setSimulatedUser(actor());
    const pending = <T,>() => new Promise<T>(() => {});
    const repos = {
      auth,
      aziende: { list: () => pending<unknown[]>() },
      conti: { list: () => pending<unknown[]>() },
      attivita: { list: () => pending<unknown[]>() },
    } as unknown as Repositories;

    const { container } = render(<PagamentiPage />, {
      wrapper: buildProvidersWrapper({ repos, withRouter: true }),
    });
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0
    );
  });

  it("shows the empty state when there are no aziende", async () => {
    const auth = new InMemoryAuthService();
    auth.setSimulatedUser(actor());
    const aziende = new InMemoryAziendeRepository();
    const conti = new InMemoryContiRepository();
    const attivita = new InMemoryAttivitaRepository();
    const repos = { auth, aziende, conti, attivita } as unknown as Repositories;

    render(<PagamentiPage />, {
      wrapper: buildProvidersWrapper({ repos, withRouter: true }),
    });
    await waitFor(() =>
      expect(screen.getByText(/Nessun risultato/i)).toBeInTheDocument()
    );
  });

  it("truncates a very long azienda name and keeps it accessible via title", async () => {
    const auth = new InMemoryAuthService();
    auth.setSimulatedUser(actor());
    const aziende = new InMemoryAziendeRepository();
    const conti = new InMemoryContiRepository();
    const attivita = new InMemoryAttivitaRepository();
    const repos = { auth, aziende, conti, attivita } as unknown as Repositories;

    const longName =
      "Società Agricola Cooperativa Allevamenti Riuniti della Bassa Pianura Padana";
    await aziende.create({ nome: longName }, actor(["aziende.create"]));

    render(<PagamentiPage />, {
      wrapper: buildProvidersWrapper({ repos, withRouter: true }),
    });
    const link = await screen.findByRole("link", { name: longName });
    expect(link).toHaveAttribute("title", longName);
    expect(link.className).toContain("truncate");
  });
});
