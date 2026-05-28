import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { Azienda } from "@vet/shared";
import { AziendaCard } from "../AziendaCard";

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

function renderCard(
  azienda: Azienda,
  props?: Partial<Parameters<typeof AziendaCard>[0]>
) {
  return render(
    <MemoryRouter>
      <AziendaCard
        azienda={azienda}
        canEdit={true}
        pinned={false}
        onTogglePin={() => {}}
        hasUnsaldatiConti={false}
        needsNewConto={false}
        actions={[
          {
            id: "pin",
            label: "Preferito",
            icon: <span />,
            onClick: () => {},
          },
        ]}
        {...props}
      />
    </MemoryRouter>
  );
}

describe("AziendaCard", () => {
  it("renders the name as a level-2 heading and links to the detail", () => {
    renderCard(makeAzienda({ id: "a1", nome: "Cascina Verdi" }), {
      canEdit: true,
    });
    expect(
      screen.getByRole("heading", { level: 2, name: "Cascina Verdi" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/aziende/a1"
    );
  });

  it("does not wrap the card in a link when editing is not allowed", () => {
    renderCard(makeAzienda({ id: "a1", nome: "Cascina Verdi" }), {
      canEdit: false,
    });
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("labels the paid status and reflects the unpaid state via aria-label", () => {
    const { rerender } = renderCard(
      makeAzienda({ id: "a1", nome: "Cascina Verdi" }),
      { hasUnsaldatiConti: false }
    );
    expect(screen.getByLabelText("Tutto saldato")).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <AziendaCard
          azienda={makeAzienda({ id: "a1", nome: "Cascina Verdi" })}
          canEdit={true}
          pinned={false}
          onTogglePin={() => {}}
          hasUnsaldatiConti={true}
          needsNewConto={false}
        />
      </MemoryRouter>
    );
    expect(screen.getByLabelText("Conti non saldati")).toBeInTheDocument();
  });

  it("exposes the pin action with aria-pressed reflecting the pinned flag", () => {
    renderCard(makeAzienda({ id: "a1", nome: "Cascina Verdi" }), {
      pinned: true,
    });
    const pin = screen.getByRole("button", {
      name: /Rimuovi dai preferiti/i,
    });
    expect(pin).toHaveAttribute("aria-pressed", "true");
  });

  it("formats the herd count in Italian and shows the capitalized type", () => {
    renderCard(
      makeAzienda({
        id: "a1",
        nome: "Cascina Verdi",
        tipoAllevamento: "bovini",
        numeroCapi: 1250,
      })
    );
    const capi = new Intl.NumberFormat("it-IT", {
      maximumFractionDigits: 0,
    }).format(1250);
    expect(screen.getByText(new RegExp(`Bovini.*${capi} capi`))).toBeInTheDocument();
  });

  it("renders a missing-cadence hint instead of crashing on absent fields", () => {
    renderCard(makeAzienda({ id: "a1", nome: "Cascina Verdi" }));
    expect(screen.getByText("Cadenza non impostata")).toBeInTheDocument();
  });

  it("keeps the heading present for an extremely long name", () => {
    const longName =
      "Societa Agricola Cooperativa Allevamenti Bovini da Latte Valle del Po Lombardia Orientale Distretto 7";
    renderCard(makeAzienda({ id: "a1", nome: longName }));
    expect(
      screen.getByRole("heading", { level: 2, name: longName })
    ).toBeInTheDocument();
  });
});
