import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Attivita, Repositories } from "@vet/shared";
import { buildProvidersWrapper } from "../../../../__tests__/renderWithProviders";
import { createInMemoryRepositories } from "../../../../infrastructure/composition/in-memory";
import { AttivitaDataGrid, groupingFor } from "../AttivitaDataGrid";

function makeAttivita(partial: Partial<Attivita> & { id: string }): Attivita {
  const now = new Date(2026, 4, 1);
  return {
    id: partial.id,
    data: partial.data ?? now,
    aziendaId: partial.aziendaId ?? "az1",
    aziendaNome: partial.aziendaNome ?? "Cascina Verdi",
    tipoId: partial.tipoId ?? "tipo-visita",
    tipoNome: partial.tipoNome ?? "Visita",
    oraria: partial.oraria ?? false,
    adElemento: partial.adElemento ?? false,
    tariffa: partial.tariffa ?? 50,
    ore: partial.ore ?? undefined,
    elementi: partial.elementi ?? undefined,
    totale: partial.totale ?? 50,
    note: partial.note ?? undefined,
    ownerUid: partial.ownerUid ?? "vet-1",
    ownerEmail: partial.ownerEmail ?? "vet@example.com",
    ownerName: partial.ownerName ?? "Vet One",
    createdAt: now,
    updatedAt: now,
    isDeleted: false,
    schemaVersion: 1,
  } as Attivita;
}

interface RenderGridOverrides {
  isLoading?: boolean;
  isError?: boolean;
  filtersActive?: boolean;
  onClearFilters?: () => void;
}

function renderGrid(
  items: Attivita[],
  group: "none" | "azienda" | "giorno" | "vet" = "none",
  overrides: RenderGridOverrides = {}
) {
  const repos = createInMemoryRepositories() as unknown as Repositories;
  return render(
    <AttivitaDataGrid
      items={items}
      group={group}
      isLoading={overrides.isLoading ?? false}
      isError={overrides.isError ?? false}
      filtersActive={overrides.filtersActive ?? false}
      {...(overrides.onClearFilters
        ? { onClearFilters: overrides.onClearFilters }
        : {})}
    />,
    {
      wrapper: buildProvidersWrapper({ repos, withRouter: true }),
    }
  );
}

describe("AttivitaDataGrid", () => {
  it("renders rows in flat mode (group=none)", () => {
    const items = [
      makeAttivita({ id: "a1", aziendaNome: "Acme", totale: 100 }),
      makeAttivita({ id: "a2", aziendaNome: "Beta", totale: 200 }),
      makeAttivita({ id: "a3", aziendaNome: "Gamma", totale: 300 }),
    ];
    renderGrid(items, "none");
    // Each aziendaNome appears at least once across desktop+mobile renders
    expect(screen.getAllByText("Acme").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Beta").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Gamma").length).toBeGreaterThan(0);
  });

  it("renders 2 group headers when group=azienda with 2 distinct aziende", () => {
    const items = [
      makeAttivita({ id: "a1", aziendaId: "az1", aziendaNome: "Acme", totale: 100 }),
      makeAttivita({ id: "a2", aziendaId: "az1", aziendaNome: "Acme", totale: 150 }),
      makeAttivita({ id: "a3", aziendaId: "az2", aziendaNome: "Beta", totale: 200 }),
    ];
    renderGrid(items, "azienda");
    // Two distinct group labels: "Acme" and "Beta"
    // Multiple instances per label across desktop/mobile + cells; assert at least one each
    expect(screen.getAllByText("Acme").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Beta").length).toBeGreaterThan(0);
  });

  it("renders empty state when items=[] and filtersActive=false", () => {
    renderGrid([], "none");
    // EmptyAttivita renders the emptyAll title
    expect(screen.getAllByText("Nessuna attività registrata.").length).toBeGreaterThan(0);
  });

  it("renders the filtered empty state with a clear-filters action", () => {
    const onClearFilters = vi.fn();
    renderGrid([], "none", { filtersActive: true, onClearFilters });
    expect(
      screen.getAllByText("Nessun risultato per i filtri scelti.").length
    ).toBeGreaterThan(0);
    const clear = screen.getAllByRole("button", { name: "Pulisci filtri" });
    expect(clear.length).toBeGreaterThan(0);
    fireEvent.click(clear[0]!);
    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });

  it("shows a loading state and no rows while isLoading is true", () => {
    renderGrid(
      [makeAttivita({ id: "a1", aziendaNome: "Acme" })],
      "none",
      { isLoading: true }
    );
    expect(screen.queryByText("Acme")).not.toBeInTheDocument();
  });

  it("shows an error alert when isError is true", () => {
    renderGrid([], "none", { isError: true });
    const alerts = screen.getAllByRole("alert");
    expect(alerts.length).toBeGreaterThan(0);
    expect(screen.getAllByText("Caricamento fallito.").length).toBeGreaterThan(0);
  });

  it("formats hours with an Italian decimal comma", () => {
    renderGrid(
      [makeAttivita({ id: "a1", oraria: true, ore: 1.5, tariffa: 40, totale: 60 })],
      "none"
    );
    expect(screen.getAllByText("1,5").length).toBeGreaterThan(0);
  });

  it("renders without breaking on very long azienda, tipo and note values", () => {
    const longName = "Azienda".repeat(40);
    const longNote = "x".repeat(500);
    renderGrid(
      [
        makeAttivita({
          id: "a1",
          aziendaNome: longName,
          tipoNome: "Tipo".repeat(40),
          note: longNote,
        }),
      ],
      "none"
    );
    expect(screen.getAllByText(longName).length).toBeGreaterThan(0);
    expect(screen.getAllByText(longNote).length).toBeGreaterThan(0);
  });
});

describe("groupingFor", () => {
  it("returns undefined for 'none'", () => {
    expect(groupingFor("none")).toBeUndefined();
  });

  it("returns grouping with aziendaId keyOf for 'azienda'", () => {
    const g = groupingFor("azienda");
    expect(g).toBeDefined();
    const a = makeAttivita({ id: "x", aziendaId: "az1", aziendaNome: "Acme", totale: 50 });
    expect(g!.keyOf(a)).toBe("az1");
    expect(g!.labelOf("az1", [a])).toBe("Acme");
  });

  it("returns grouping with ownerUid keyOf for 'vet'", () => {
    const g = groupingFor("vet");
    expect(g).toBeDefined();
    const a = makeAttivita({ id: "x", ownerUid: "uid-1", ownerName: "Dr Rossi" });
    expect(g!.keyOf(a)).toBe("uid-1");
    expect(g!.labelOf("uid-1", [a])).toBe("Dr Rossi");
  });

  it("returns grouping with ISO date keyOf for 'giorno'", () => {
    const g = groupingFor("giorno");
    expect(g).toBeDefined();
    const a = makeAttivita({ id: "x", data: new Date(2026, 4, 15) });
    expect(g!.keyOf(a)).toBe("2026-05-15");
  });
});
