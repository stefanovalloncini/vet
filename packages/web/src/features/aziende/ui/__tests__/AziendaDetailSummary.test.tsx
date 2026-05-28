import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { Azienda } from "@vet/shared";
import { AziendaDetailSummary } from "../AziendaDetailSummary";

function makeAzienda(
  overrides: Partial<Azienda> & { id: string; nome: string }
): Azienda {
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

describe("AziendaDetailSummary", () => {
  it("renders the name as the single page heading", () => {
    render(
      <MemoryRouter>
        <AziendaDetailSummary
          azienda={makeAzienda({ id: "a1", nome: "Cascina Rossi" })}
          canEdit={false}
        />
      </MemoryRouter>
    );
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent("Cascina Rossi");
  });

  it("provides a back link to the aziende list", () => {
    render(
      <MemoryRouter>
        <AziendaDetailSummary
          azienda={makeAzienda({ id: "a1", nome: "Cascina Rossi" })}
          canEdit={false}
        />
      </MemoryRouter>
    );
    const back = screen.getByRole("link", { name: /Aziende/i });
    expect(back).toHaveAttribute("href", "/aziende");
  });

  it("links the address to maps when present and omits it when absent", () => {
    const { rerender } = render(
      <MemoryRouter>
        <AziendaDetailSummary
          azienda={makeAzienda({
            id: "a1",
            nome: "Cascina Rossi",
            indirizzo: "Via Roma 1, Milano",
          })}
          canEdit={false}
        />
      </MemoryRouter>
    );
    const maps = screen.getByRole("link", { name: /Via Roma 1, Milano/i });
    expect(maps.getAttribute("href")).toContain(
      encodeURIComponent("Via Roma 1, Milano")
    );

    rerender(
      <MemoryRouter>
        <AziendaDetailSummary
          azienda={makeAzienda({ id: "a1", nome: "Cascina Rossi" })}
          canEdit={false}
        />
      </MemoryRouter>
    );
    expect(screen.queryByRole("link", { name: /Via Roma/i })).toBeNull();
  });

  it("hides edit and archive actions when the user cannot edit", () => {
    render(
      <MemoryRouter>
        <AziendaDetailSummary
          azienda={makeAzienda({ id: "a1", nome: "Cascina Rossi" })}
          canEdit={false}
          onArchive={() => {}}
        />
      </MemoryRouter>
    );
    expect(screen.queryByRole("button", { name: /Modifica/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /Archivia/i })).toBeNull();
  });

  it("shows edit and archive actions when allowed", () => {
    const onArchive = vi.fn();
    render(
      <MemoryRouter>
        <AziendaDetailSummary
          azienda={makeAzienda({ id: "a1", nome: "Cascina Rossi" })}
          canEdit={true}
          onArchive={onArchive}
        />
      </MemoryRouter>
    );
    expect(
      screen.getByRole("link", { name: /Modifica/i })
    ).toHaveAttribute("href", "/aziende/a1/modifica");
    expect(
      screen.getByRole("button", { name: /Archivia/i })
    ).toBeInTheDocument();
  });
});
