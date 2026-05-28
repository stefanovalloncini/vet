import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { Azienda } from "@vet/shared";
import { AziendaInfoCard } from "../AziendaInfoCard";

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

function renderCard(azienda: Azienda, total = 0, paidTotal = 0) {
  return render(
    <MemoryRouter>
      <AziendaInfoCard
        azienda={azienda}
        total={total}
        paidTotal={paidTotal}
        tags={[]}
        onTagsChange={() => {}}
        canExport={false}
      />
    </MemoryRouter>
  );
}

describe("AziendaInfoCard", () => {
  it("renders only the fields that are present", () => {
    renderCard(makeAzienda({ id: "a1", nome: "Cascina Rossi" }));
    expect(screen.queryByText("Allevamento")).toBeNull();
    expect(screen.queryByText("Capi")).toBeNull();
    expect(screen.queryByText("Telefono")).toBeNull();
    expect(screen.queryByText("P.IVA")).toBeNull();
    expect(screen.getByText("Totale storico")).toBeInTheDocument();
    expect(screen.getByText("Incassato")).toBeInTheDocument();
  });

  it("formats the herd count with the Italian number formatter", () => {
    renderCard(
      makeAzienda({ id: "a1", nome: "Cascina Rossi", numeroCapi: 4200 })
    );
    expect(screen.getByText("Capi")).toBeInTheDocument();
    const expected = new Intl.NumberFormat("it-IT", {
      maximumFractionDigits: 0,
    }).format(4200);
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("renders a telephone link pointing at a tel: href", () => {
    renderCard(
      makeAzienda({
        id: "a1",
        nome: "Cascina Rossi",
        telefono: "+39 051 234 5678",
      })
    );
    const tel = screen.getByRole("link", { name: "+39 051 234 5678" });
    expect(tel.getAttribute("href")).toMatch(/^tel:/);
  });

  it("shows a long P.IVA and a long note without throwing", () => {
    const longNote =
      "Allevamento storico con stalla nuova da ristrutturare, contatti via WhatsApp solo dopo le 18 perche di giorno sono in campagna e non sento il telefono squillare mai";
    renderCard(
      makeAzienda({
        id: "a1",
        nome: "Cascina Rossi",
        piva: "12345678903",
        note: longNote,
      })
    );
    expect(screen.getByText("12345678903")).toBeInTheDocument();
    expect(screen.getByText(longNote)).toBeInTheDocument();
  });

  it("offers the printable summary link only when export is allowed", () => {
    const { rerender } = renderCard(
      makeAzienda({ id: "a1", nome: "Cascina Rossi" })
    );
    expect(
      screen.queryByRole("link", { name: /riepilogo stampabile/i })
    ).toBeNull();

    rerender(
      <MemoryRouter>
        <AziendaInfoCard
          azienda={makeAzienda({ id: "a1", nome: "Cascina Rossi" })}
          total={0}
          paidTotal={0}
          tags={[]}
          onTagsChange={() => {}}
          canExport={true}
        />
      </MemoryRouter>
    );
    expect(
      screen.getByRole("link", { name: /riepilogo stampabile/i })
    ).toHaveAttribute("href", "/aziende/a1/riepilogo");
  });
});
