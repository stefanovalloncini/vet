import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Attivita, Azienda } from "@vet/shared";
import { ToastProvider } from "../../../../shared/ui/Toast";
import { RepositoriesProvider } from "../../../../infrastructure/RepositoriesContext";
import { createInMemoryRepositories } from "../../../../infrastructure/composition/in-memory";
import type { StatisticheData } from "../../hooks/useStatistiche";
import { StatistichePage } from "../StatistichePage";

vi.mock("../../hooks/useStatistiche", () => ({
  useStatistiche: vi.fn(),
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
        caps: new Set(["activities.read.all", "aziende.read"]),
      },
      ready: true,
    }),
  };
});

import { useStatistiche } from "../../hooks/useStatistiche";

const useStatisticheMock = useStatistiche as unknown as ReturnType<typeof vi.fn>;

function attivita(over: Partial<Attivita> = {}): Attivita {
  return {
    id: "a1",
    data: new Date("2026-05-04T08:00:00"),
    aziendaId: "az1",
    aziendaNome: "Cascina Verde",
    tipoId: "t1",
    tipoNome: "Ginecologia",
    oraria: false,
    adElemento: false,
    tariffa: 40,
    totale: 40,
    ownerUid: "u1",
    ownerEmail: "u1@vet.com",
    ownerName: "Vet One",
    createdAt: new Date("2026-05-04T08:00:00"),
    updatedAt: new Date("2026-05-04T08:00:00"),
    isDeleted: false,
    schemaVersion: 1,
    ...over,
  };
}

function baseData(over: Partial<StatisticheData> = {}): StatisticheData {
  return {
    loading: false,
    items: [attivita()],
    aziende: [] as Azienda[],
    byTipo: [{ label: "Ginecologia", value: 40 }],
    topClients: [{ label: "Cascina Verde", value: 40, count: 1 }],
    monthlyComparison: {
      thisYear: new Array<number>(12).fill(0),
      lastYear: new Array<number>(12).fill(0),
    },
    stackedMonths: [{ label: "Mag", total: 40, segments: [{ key: "t1", label: "Ginecologia", value: 40 }] }],
    funnel: [{ label: "Visite registrate", value: 1 }],
    totalRange: 40,
    totalLastYear: 0,
    yoyDiff: null,
    ...over,
  };
}

function renderPage() {
  const repos = createInMemoryRepositories();
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <RepositoriesProvider value={repos}>
        <ToastProvider>
          <MemoryRouter initialEntries={["/statistiche"]}>
            <StatistichePage />
          </MemoryRouter>
        </ToastProvider>
      </RepositoriesProvider>
    </QueryClientProvider>
  );
}

describe("StatistichePage", () => {
  it("renders a single h1 and the period selector", () => {
    useStatisticheMock.mockReturnValue(baseData());
    renderPage();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 1, name: /Statistiche/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Periodo")).toBeInTheDocument();
  });

  it("shows the loading state while pending", () => {
    useStatisticheMock.mockReturnValue(baseData({ loading: true, items: [] }));
    renderPage();
    expect(screen.getByText("Caricamento…")).toBeInTheDocument();
    expect(screen.queryByText("Nessun dato per il periodo.")).not.toBeInTheDocument();
  });

  it("shows the empty state when there are no items", () => {
    useStatisticheMock.mockReturnValue(baseData({ items: [] }));
    renderPage();
    expect(screen.getByText("Nessun dato per il periodo.")).toBeInTheDocument();
  });

  it("renders the summary figures with an aria-live region", () => {
    useStatisticheMock.mockReturnValue(
      baseData({ items: [attivita(), attivita({ id: "a2" })], totalRange: 80 })
    );
    renderPage();
    expect(screen.getByText("Visite")).toBeInTheDocument();
    const ricavi = screen.getByText("Ricavi");
    const dl = ricavi.closest("dl");
    expect(dl).toHaveAttribute("aria-live", "polite");
  });

  it("renders accessible chart labels for the heatmap and weekday chart", () => {
    useStatisticheMock.mockReturnValue(baseData());
    renderPage();
    expect(
      screen.getByRole("img", { name: /Mappa attività/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /Visite per giorno della settimana/i })
    ).toBeInTheDocument();
  });

  it("does not crash and shows panel placeholders when sub-datasets are empty", () => {
    useStatisticheMock.mockReturnValue(
      baseData({
        topClients: [],
        byTipo: [],
        funnel: [],
        items: [attivita()],
      })
    );
    renderPage();
    expect(
      screen.getByRole("heading", { level: 1, name: /Statistiche/i })
    ).toBeInTheDocument();
    expect(screen.getAllByText("Nessun dato per il periodo.").length).toBeGreaterThan(0);
  });
});
