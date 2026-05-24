import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SuggestionsPanel } from "../SuggestionsPanel";
import type { Combo, ComputeCombosResult } from "../../lib/recentCombos";

function combo(over: Partial<Combo>): Combo {
  return {
    aziendaId: "az1",
    aziendaNome: "Bianchi",
    tipoId: "tp1",
    tipoNome: "Visita",
    tariffa: 45,
    lastUsed: new Date(),
    count: 1,
    ...over,
  };
}

function make(
  recents: ReadonlyArray<Combo>,
  frequents: ReadonlyArray<Combo> = recents
): ComputeCombosResult {
  return { recents, frequents };
}

describe("SuggestionsPanel", () => {
  it("renders nothing when there are no recents", () => {
    const { container } = render(
      <SuggestionsPanel combos={make([])} onPick={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("lists the recents with azienda, tipo and tariffa", () => {
    render(
      <SuggestionsPanel
        combos={make([
          combo({ aziendaNome: "Bianchi", tipoNome: "Visita", tariffa: 45 }),
          combo({
            aziendaId: "az2",
            aziendaNome: "Rossi",
            tipoNome: "Vaccino",
            tariffa: 30,
          }),
        ])}
        onPick={vi.fn()}
      />
    );
    expect(screen.getByText("Bianchi")).toBeInTheDocument();
    expect(screen.getByText(/Visita/)).toBeInTheDocument();
    expect(screen.getByText(/45,00/)).toBeInTheDocument();
    expect(screen.getByText("Rossi")).toBeInTheDocument();
    expect(screen.getByText(/30,00/)).toBeInTheDocument();
  });

  it("hides the Frequenti tab until there are 5 distinct combos", () => {
    render(
      <SuggestionsPanel
        combos={make([
          combo({ aziendaId: "a", tipoId: "t" }),
          combo({ aziendaId: "b", tipoId: "t" }),
        ])}
        onPick={vi.fn()}
      />
    );
    expect(screen.queryByRole("tab", { name: /Frequenti/i })).toBeNull();
  });

  it("shows the Frequenti tab when there are 5 or more combos", () => {
    const five = Array.from({ length: 5 }).map((_, i) =>
      combo({ aziendaId: `a${i}`, tipoId: "t" })
    );
    render(<SuggestionsPanel combos={make(five)} onPick={vi.fn()} />);
    expect(screen.getByRole("tab", { name: /Frequenti/i })).toBeInTheDocument();
  });

  it("switches to the Frequenti list and shows usage count", () => {
    const recents = Array.from({ length: 5 }).map((_, i) =>
      combo({ aziendaId: `r${i}`, aziendaNome: `R${i}`, tipoId: "t" })
    );
    const frequents = [
      combo({ aziendaId: "f1", aziendaNome: "Frequent", tipoId: "t", count: 12 }),
      ...Array.from({ length: 4 }).map((_, i) =>
        combo({ aziendaId: `f${i + 2}`, aziendaNome: `F${i}`, tipoId: "t", count: 2 })
      ),
    ];
    render(
      <SuggestionsPanel combos={make(recents, frequents)} onPick={vi.fn()} />
    );
    fireEvent.click(screen.getByRole("tab", { name: /Frequenti/i }));
    expect(screen.getByText("Frequent")).toBeInTheDocument();
    expect(screen.getByText(/12 volte/)).toBeInTheDocument();
  });

  it("calls onPick with the combo when a row is clicked", () => {
    const onPick = vi.fn();
    const c = combo({ aziendaId: "az9", tipoId: "tp9", tariffa: 88 });
    render(<SuggestionsPanel combos={make([c])} onPick={onPick} />);
    fireEvent.click(screen.getByRole("button", { name: /Bianchi/ }));
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick).toHaveBeenCalledWith(c);
  });

  it("marks the active row with aria-pressed", () => {
    const c1 = combo({ aziendaId: "a", tipoId: "t", aziendaNome: "A" });
    const c2 = combo({ aziendaId: "b", tipoId: "t", aziendaNome: "B" });
    render(
      <SuggestionsPanel
        combos={make([c1, c2])}
        active={{ aziendaId: "b", tipoId: "t" }}
        onPick={vi.fn()}
      />
    );
    expect(
      screen.getByRole("button", { name: /A/, pressed: false })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /B/, pressed: true })
    ).toBeInTheDocument();
  });
});
