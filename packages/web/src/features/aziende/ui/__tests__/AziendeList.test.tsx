import { render, screen } from "@testing-library/react";
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
});
