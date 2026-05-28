import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { Attivita } from "@vet/shared";
import { AttivitaRow } from "../AttivitaRow";

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

function renderRow(a: Attivita) {
  return render(
    <MemoryRouter>
      <AttivitaRow attivita={a} />
    </MemoryRouter>
  );
}

describe("AttivitaRow", () => {
  it("links to the edit route for the attivita", () => {
    renderRow(makeAttivita({ id: "abc" }));
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/attivita/abc");
  });

  it("shows the azienda, tipo and owner", () => {
    renderRow(
      makeAttivita({
        id: "a1",
        aziendaNome: "Cascina Verdi",
        tipoNome: "Ginecologia",
        ownerName: "Dr Rossi",
      })
    );
    expect(screen.getByText("Cascina Verdi")).toBeInTheDocument();
    expect(screen.getByText("Ginecologia")).toBeInTheDocument();
    expect(screen.getByText("Dr Rossi")).toBeInTheDocument();
  });

  it("formats hourly rate detail with an Italian decimal comma", () => {
    renderRow(
      makeAttivita({ id: "a1", oraria: true, ore: 1.5, tariffa: 40, totale: 60 })
    );
    expect(screen.getByText(/× 1,5h/)).toBeInTheDocument();
  });

  it("omits the rate detail when not hourly", () => {
    renderRow(makeAttivita({ id: "a1", oraria: false, tariffa: 40 }));
    expect(screen.queryByText(/\/h ×/)).not.toBeInTheDocument();
  });

  it("renders a very long azienda name and note without throwing", () => {
    const longName = "Allevamento".repeat(30);
    const longNote = "n".repeat(600);
    renderRow(makeAttivita({ id: "a1", aziendaNome: longName, note: longNote }));
    expect(screen.getByText(longName)).toBeInTheDocument();
    expect(screen.getByText(longNote)).toBeInTheDocument();
  });
});
