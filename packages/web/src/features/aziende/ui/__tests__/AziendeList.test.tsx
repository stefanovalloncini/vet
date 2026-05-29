import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { Azienda } from "@vet/shared";
import type { FilterDef } from "../../../../shared/ui/data-grid";
import { AziendeList } from "../AziendeList";

function makeAzienda(overrides: Partial<Azienda> & { id: string; nome: string }): Azienda {
  const { id, nome, ...rest } = overrides;
  return {
    id,
    nome,
    nomeNorm: nome.toLowerCase(),
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    createdBy: "u1",
    updatedBy: "u1",
    createdByName: "Tester",
    updatedByName: "Tester",
    isDeleted: false,
    schemaVersion: 1,
    ...rest,
  };
}

function defaultFilters(stato = ""): ReadonlyArray<FilterDef> {
  return [
    {
      id: "stato",
      label: "Stato",
      kind: "select",
      value: stato,
      options: [
        { value: "", label: "Tutti" },
        { value: "unpaid", label: "Conti non saldati" },
        { value: "todo", label: "Da emettere" },
        { value: "ok", label: "Tutto saldato" },
      ],
    },
  ];
}

describe("AziendeList (DataGrid cards mode)", () => {
  it("renders a card per item via the DataGrid card renderer", () => {
    const items: ReadonlyArray<Azienda> = [
      makeAzienda({ id: "a1", nome: "Allevamento Alfa" }),
      makeAzienda({ id: "a2", nome: "Allevamento Beta" }),
      makeAzienda({ id: "a3", nome: "Allevamento Gamma" }),
    ];

    render(
      <MemoryRouter>
        <AziendeList
          items={items}
          loading={false}
          error={null}
          canEdit={true}
          canCreate={true}
          searching={false}
          isPinned={() => false}
          onTogglePin={() => {}}
          filters={defaultFilters()}
          onFiltersChange={() => {}}
        />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", { name: "Allevamento Alfa" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Allevamento Beta" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Allevamento Gamma" })
    ).toBeInTheDocument();

    // Pin action is exposed once per card as a row action button.
    const pinButtons = screen.getAllByRole("button", {
      name: /Aggiungi ai preferiti/i,
    });
    expect(pinButtons).toHaveLength(3);
  });

  it("links each name to the azienda detail in the desktop table", () => {
    const items: ReadonlyArray<Azienda> = [
      makeAzienda({ id: "a1", nome: "Allevamento Alfa" }),
    ];

    render(
      <MemoryRouter>
        <AziendeList
          items={items}
          loading={false}
          error={null}
          canEdit={true}
          canCreate={true}
          searching={false}
          isPinned={() => false}
          onTogglePin={() => {}}
          filters={defaultFilters()}
          onFiltersChange={() => {}}
        />
      </MemoryRouter>
    );

    const table = screen.getByRole("table");
    const link = within(table).getByRole("link", { name: "Allevamento Alfa" });
    expect(link).toHaveAttribute("href", "/aziende/a1");
  });

  it("narrows visible cards when the stato filter is set to 'unpaid'", () => {
    const items: ReadonlyArray<Azienda> = [
      makeAzienda({ id: "a1", nome: "Allevamento Alfa" }),
      makeAzienda({ id: "a2", nome: "Allevamento Beta" }),
      makeAzienda({ id: "a3", nome: "Allevamento Gamma" }),
    ];
    const hasUnsaldatiContiBy = new Set<string>(["a2"]);
    const onFiltersChange = vi.fn();

    const { rerender } = render(
      <MemoryRouter>
        <AziendeList
          items={items}
          loading={false}
          error={null}
          canEdit={true}
          canCreate={true}
          searching={false}
          isPinned={() => false}
          onTogglePin={() => {}}
          hasUnsaldatiContiBy={hasUnsaldatiContiBy}
          filters={defaultFilters("")}
          onFiltersChange={onFiltersChange}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Allevamento Alfa" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Allevamento Beta" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Allevamento Gamma" })).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <AziendeList
          items={items}
          loading={false}
          error={null}
          canEdit={true}
          canCreate={true}
          searching={false}
          isPinned={() => false}
          onTogglePin={() => {}}
          hasUnsaldatiContiBy={hasUnsaldatiContiBy}
          filters={defaultFilters("unpaid")}
          onFiltersChange={onFiltersChange}
        />
      </MemoryRouter>
    );

    expect(screen.queryByRole("heading", { name: "Allevamento Alfa" })).toBeNull();
    expect(screen.getByRole("heading", { name: "Allevamento Beta" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Allevamento Gamma" })).toBeNull();
  });

  it("announces the loading state and renders no cards while loading", () => {
    render(
      <MemoryRouter>
        <AziendeList
          items={[]}
          loading={true}
          error={null}
          canEdit={true}
          canCreate={true}
          searching={false}
          isPinned={() => false}
          onTogglePin={() => {}}
          filters={defaultFilters()}
          onFiltersChange={() => {}}
        />
      </MemoryRouter>
    );
    expect(screen.queryByRole("heading", { level: 2 })).toBeNull();
  });

  it("surfaces a generic error message via an alert role", () => {
    render(
      <MemoryRouter>
        <AziendeList
          items={[]}
          loading={false}
          error="Salvataggio non riuscito. Riprova."
          canEdit={true}
          canCreate={true}
          searching={false}
          isPinned={() => false}
          onTogglePin={() => {}}
          filters={defaultFilters()}
          onFiltersChange={() => {}}
        />
      </MemoryRouter>
    );
    const alert = screen.getByRole("alert");
    expect(within(alert).getByText(/Salvataggio non riuscito/i)).toBeInTheDocument();
  });

  it("shows the empty state with a creation hint when nothing exists", () => {
    render(
      <MemoryRouter>
        <AziendeList
          items={[]}
          loading={false}
          error={null}
          canEdit={true}
          canCreate={true}
          searching={false}
          isPinned={() => false}
          onTogglePin={() => {}}
          filters={defaultFilters()}
          onFiltersChange={() => {}}
        />
      </MemoryRouter>
    );
    expect(screen.getByText("Nessuna azienda.")).toBeInTheDocument();
    expect(
      screen.getByText(/Usa Nuova azienda in alto/i)
    ).toBeInTheDocument();
  });

  it("shows the search empty state when filtering yields nothing", () => {
    render(
      <MemoryRouter>
        <AziendeList
          items={[]}
          loading={false}
          error={null}
          canEdit={true}
          canCreate={true}
          searching={true}
          isPinned={() => false}
          onTogglePin={() => {}}
          filters={defaultFilters()}
          onFiltersChange={() => {}}
        />
      </MemoryRouter>
    );
    expect(screen.getByText("Nessun risultato.")).toBeInTheDocument();
  });

  it("renders an overlong azienda name without dropping the heading", () => {
    const longName =
      "Societa Agricola Cooperativa Allevamenti Bovini da Latte e Carne Valle del Po Lombardia Orientale";
    render(
      <MemoryRouter>
        <AziendeList
          items={[
            makeAzienda({
              id: "a1",
              nome: longName,
              indirizzo:
                "Strada Provinciale 12 Localita Cascina Grande Frazione San Giovanni in Persiceto 40017 Bologna",
              piva: "12345678903",
              telefono: "+39 0512345678",
            }),
          ]}
          loading={false}
          error={null}
          canEdit={true}
          canCreate={true}
          searching={false}
          isPinned={() => false}
          onTogglePin={() => {}}
          filters={defaultFilters()}
          onFiltersChange={() => {}}
        />
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: longName })).toBeInTheDocument();
  });
});
