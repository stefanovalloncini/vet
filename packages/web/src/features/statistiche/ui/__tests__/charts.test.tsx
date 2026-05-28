import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import type { Attivita, Azienda } from "@vet/shared";
import { DonutChart } from "../DonutChart";
import { Funnel } from "../Funnel";
import { StackedBarChart } from "../StackedBarChart";
import { WeekdayChart } from "../WeekdayChart";
import { Heatmap } from "../Heatmap";
import { ZonePanel } from "../ZonePanel";

const euro = (n: number) => `${n} EUR`;

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

describe("statistiche charts: empty states", () => {
  it("DonutChart shows a placeholder when total is zero", () => {
    render(<DonutChart slices={[{ label: "x", value: 0 }]} formatValue={euro} />);
    expect(screen.getByText("Nessun dato per il periodo.")).toBeInTheDocument();
  });

  it("DonutChart renders an accessible img when it has data", () => {
    render(
      <DonutChart
        slices={[
          { label: "Ginecologia", value: 40 },
          { label: "Altro", value: 10 },
        ]}
        formatValue={euro}
      />
    );
    expect(
      screen.getByRole("img", { name: /Distribuzione per tipo/i })
    ).toBeInTheDocument();
  });

  it("Funnel shows a placeholder when every stage is zero", () => {
    render(<Funnel stages={[{ label: "Visite", value: 0 }]} />);
    expect(screen.getByText("Nessun dato per il periodo.")).toBeInTheDocument();
  });

  it("StackedBarChart shows a placeholder when totals are zero", () => {
    render(
      <StackedBarChart bars={[{ label: "Mag", total: 0, segments: [] }]} formatValue={euro} />
    );
    expect(screen.getByText("Nessun dato per il periodo.")).toBeInTheDocument();
  });

  it("StackedBarChart renders an accessible img with data", () => {
    render(
      <StackedBarChart
        bars={[
          {
            label: "Mag",
            total: 40,
            segments: [{ key: "t1", label: "Ginecologia", value: 40 }],
          },
        ]}
        formatValue={euro}
      />
    );
    expect(screen.getByRole("img", { name: /Ricavi mese per mese/i })).toBeInTheDocument();
  });

  it("WeekdayChart shows a placeholder when there are no items", () => {
    render(<WeekdayChart items={[]} />);
    expect(screen.getByText("Nessun dato per il periodo.")).toBeInTheDocument();
  });

  it("WeekdayChart renders an accessible img with items", () => {
    render(<WeekdayChart items={[attivita()]} />);
    expect(
      screen.getByRole("img", { name: /Visite per giorno della settimana/i })
    ).toBeInTheDocument();
  });

  it("Heatmap shows a placeholder when no item falls in range", () => {
    render(<Heatmap items={[]} now={new Date("2026-05-04")} />);
    expect(screen.getByText("Nessun dato per il periodo.")).toBeInTheDocument();
  });

  it("Heatmap renders an accessible img when items fall in range", () => {
    render(
      <Heatmap items={[attivita({ data: new Date("2026-05-04") })]} now={new Date("2026-05-04")} />
    );
    expect(screen.getByRole("img", { name: /Mappa attività/i })).toBeInTheDocument();
  });

  it("ZonePanel shows a placeholder when there are no aziende", () => {
    render(
      <MemoryRouter>
        <ZonePanel aziende={[] as Azienda[]} />
      </MemoryRouter>
    );
    expect(screen.getByText("Nessuna azienda da raggruppare.")).toBeInTheDocument();
  });
});
