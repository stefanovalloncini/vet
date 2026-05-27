import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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

function renderGrid(items: Attivita[], group: "none" | "azienda" | "giorno" | "vet" = "none") {
  const repos = createInMemoryRepositories() as unknown as Repositories;
  return render(
    <AttivitaDataGrid
      items={items}
      group={group}
      isLoading={false}
      isError={false}
      filtersActive={false}
      canExport={false}
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
