import { render, screen, within } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Attivita, Azienda } from "@vet/shared";
import { ToastProvider } from "../../../../shared/ui/Toast";
import { RepositoriesProvider } from "../../../../infrastructure/RepositoriesContext";
import { createInMemoryRepositories } from "../../../../infrastructure/composition/in-memory";
import type { DashboardStats } from "../../hooks/useDashboardStats";
import { DashboardPage } from "../DashboardPage";

vi.mock("../../hooks/useDashboardStats", () => ({
  useDashboardStats: vi.fn(),
}));

vi.mock("../../../onboarding/OnboardingBanner", () => ({
  OnboardingBanner: () => null,
}));

vi.mock("../../../onboarding", () => ({
  Onboarding: () => null,
}));

vi.mock("../../../auth", async () => {
  const actual = await vi.importActual<typeof import("../../../auth")>("../../../auth");
  return {
    ...actual,
    useAuthState: () => ({
      user: {
        uid: "u1",
        email: "u1@vet.com",
        displayName: "Vet One",
        roleId: "admin",
        caps: new Set([
          "activities.read.all",
          "aziende.read",
          "activities.create",
        ]),
      },
      ready: true,
    }),
  };
});

import { useDashboardStats } from "../../hooks/useDashboardStats";

const useDashboardStatsMock = useDashboardStats as unknown as ReturnType<typeof vi.fn>;

function renderDashboard() {
  const repos = createInMemoryRepositories();
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <RepositoriesProvider value={repos}>
        <ToastProvider>
          <MemoryRouter initialEntries={["/riepilogo"]}>
            <DashboardPage />
          </MemoryRouter>
        </ToastProvider>
      </RepositoriesProvider>
    </QueryClientProvider>
  );
}

function baseStats(overrides: Partial<DashboardStats> = {}): DashboardStats {
  const items: Attivita[] = [];
  const aziende: Azienda[] = [];
  return {
    loading: false,
    isError: false,
    items,
    aziende,
    thisMonth: {
      total: 1000,
      count: 7,
      byAzienda: new Map(),
      byTipo: new Map(),
    },
    aziendeAttiveCount: 3,
    trailing: {
      totals: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100],
      counts: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      labels: ["Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic", "Gen", "Feb", "Mar", "Apr", "Mag"],
    },
    ...overrides,
  };
}

describe("DashboardPage", () => {
  it("shows the 2 KPI cards (attività + aziende)", () => {
    useDashboardStatsMock.mockReturnValue(
      baseStats({ items: [{ id: "a1" } as Attivita] })
    );
    renderDashboard();
    expect(screen.getByText("Attività del mese")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("Aziende attive")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.queryByText("Totale incassi mese")).not.toBeInTheDocument();
  });

  it("does not render legacy Da incassare, Cliente top, Tipo top, or Totale incassi KPIs", () => {
    useDashboardStatsMock.mockReturnValue(
      baseStats({ items: [{ id: "a1" } as Attivita] })
    );
    renderDashboard();
    expect(screen.queryByText("Da incassare")).not.toBeInTheDocument();
    expect(screen.queryByText("Cliente top del mese")).not.toBeInTheDocument();
    expect(screen.queryByText("Tipo più frequente")).not.toBeInTheDocument();
    expect(screen.queryByText("Totale incassi mese")).not.toBeInTheDocument();
  });

  it("defaults the chart to Attività mode", () => {
    useDashboardStatsMock.mockReturnValue(
      baseStats({ items: [{ id: "a1" } as Attivita] })
    );
    renderDashboard();
    expect(screen.getByText(/Attività ultimi 12 mesi/)).toBeInTheDocument();
    expect(screen.queryByText(/Incassi ultimi 12 mesi/)).not.toBeInTheDocument();
  });

  it("switches chart to Incassi when toggled", () => {
    useDashboardStatsMock.mockReturnValue(
      baseStats({ items: [{ id: "a1" } as Attivita] })
    );
    renderDashboard();
    const toggle = screen.getByRole("tablist", { name: /Vista grafico/i });
    fireEvent.click(within(toggle).getByRole("tab", { name: "Incassi" }));
    expect(screen.getByText(/Incassi ultimi 12 mesi/)).toBeInTheDocument();
    expect(screen.queryByText(/Attività ultimi 12 mesi/)).not.toBeInTheDocument();
  });

  it("renders the empty-state message when there are no activities", () => {
    useDashboardStatsMock.mockReturnValue(baseStats({ items: [] }));
    renderDashboard();
    expect(
      screen.getByText("Ancora nessuna attività registrata.")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Usa il pulsante in basso a destra per registrare la prima."
      )
    ).toBeInTheDocument();
  });

  it("renders an error state when stats fails", () => {
    useDashboardStatsMock.mockReturnValue(baseStats({ isError: true }));
    renderDashboard();
    expect(screen.getByText("Caricamento fallito.")).toBeInTheDocument();
  });

  it("renders exactly one h1 heading", () => {
    useDashboardStatsMock.mockReturnValue(
      baseStats({ items: [{ id: "a1" } as Attivita] })
    );
    renderDashboard();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("exposes KPI figures via an aria-live region", () => {
    useDashboardStatsMock.mockReturnValue(
      baseStats({ items: [{ id: "a1" } as Attivita] })
    );
    renderDashboard();
    const value = screen.getByText("7");
    expect(value).toHaveAttribute("aria-live", "polite");
  });

  it("keeps the chart toggle tabs keyboard-focusable", () => {
    useDashboardStatsMock.mockReturnValue(
      baseStats({ items: [{ id: "a1" } as Attivita] })
    );
    renderDashboard();
    const toggle = screen.getByRole("tablist", { name: /Vista grafico/i });
    const tab = within(toggle).getByRole("tab", { name: "Incassi" });
    tab.focus();
    expect(tab).toHaveFocus();
  });

  it("does not break on zero and very large values", () => {
    useDashboardStatsMock.mockReturnValue(
      baseStats({
        items: [{ id: "a1" } as Attivita],
        thisMonth: {
          total: 0,
          count: 0,
          byAzienda: new Map(),
          byTipo: new Map(),
        },
        aziendeAttiveCount: 0,
        trailing: {
          totals: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9_999_999],
          counts: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          labels: ["Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic", "Gen", "Feb", "Mar", "Apr", "Mag"],
        },
      })
    );
    renderDashboard();
    expect(screen.getByText("Attività del mese")).toBeInTheDocument();
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
  });
});
