import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AttivitaFilterBar } from "../AttivitaFilterBar";

const baseProps = {
  from: "",
  to: "",
  aziendaId: "",
  tipoId: "",
  vetUid: "",
  aziendaOptions: [
    { value: "", label: "Tutti" },
    { value: "az1", label: "Cascina" },
  ],
  tipoOptions: [
    { value: "", label: "Tutti" },
    { value: "ginecologia", label: "Ginecologia" },
  ],
  vetOptions: [
    { value: "", label: "Tutti" },
    { value: "u-1", label: "Vet One" },
    { value: "u-2", label: "Vet Two" },
  ],
  onClearAll: vi.fn(),
};

describe("AttivitaFilterBar", () => {
  it("renders 5 filter controls on desktop", () => {
    const onChange = vi.fn();
    render(<AttivitaFilterBar {...baseProps} onChange={onChange} />);
    expect(screen.getByLabelText("Da")).toBeInTheDocument();
    expect(screen.getByLabelText("A")).toBeInTheDocument();
    expect(screen.getByLabelText("Azienda")).toBeInTheDocument();
    expect(screen.getByLabelText("Tipo")).toBeInTheDocument();
    expect(screen.getByLabelText("Veterinario")).toBeInTheDocument();
    expect(screen.queryByLabelText("Raggruppa per")).not.toBeInTheDocument();
  });

  it("emits onChange with 'vet' when the vet dropdown changes", () => {
    const onChange = vi.fn();
    render(<AttivitaFilterBar {...baseProps} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Veterinario"), {
      target: { value: "u-2" },
    });
    expect(onChange).toHaveBeenCalledWith("vet", "u-2");
  });

  it("emits onChange with 'azienda' when the azienda dropdown changes", () => {
    const onChange = vi.fn();
    render(<AttivitaFilterBar {...baseProps} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Azienda"), {
      target: { value: "az1" },
    });
    expect(onChange).toHaveBeenCalledWith("azienda", "az1");
  });

  it("reflects the controlled value for vetUid", () => {
    const { rerender } = render(
      <AttivitaFilterBar {...baseProps} vetUid="u-1" onChange={vi.fn()} />
    );
    expect(
      (screen.getByLabelText("Veterinario") as HTMLSelectElement).value
    ).toBe("u-1");
    rerender(
      <AttivitaFilterBar {...baseProps} vetUid="" onChange={vi.fn()} />
    );
    expect(
      (screen.getByLabelText("Veterinario") as HTMLSelectElement).value
    ).toBe("");
  });

  it("shows mobile Filtri button with active-filter badge", () => {
    render(
      <AttivitaFilterBar
        {...baseProps}
        from="2026-05-01"
        aziendaId="az1"
        onChange={vi.fn()}
      />
    );
    const trigger = screen.getByLabelText("Filtri");
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(screen.getByLabelText("2 filtri attivi")).toBeInTheDocument();
  });

  it("shows clear button when at least one filter is active", () => {
    const onClearAll = vi.fn();
    render(
      <AttivitaFilterBar
        {...baseProps}
        aziendaId="az1"
        onClearAll={onClearAll}
        onChange={vi.fn()}
      />
    );
    const clearButtons = screen.getAllByRole("button", { name: "Pulisci filtri" });
    expect(clearButtons.length).toBeGreaterThan(0);
    fireEvent.click(clearButtons[0]!);
    expect(onClearAll).toHaveBeenCalledTimes(1);
  });

  it("hides clear button when no filter is active", () => {
    render(<AttivitaFilterBar {...baseProps} onChange={vi.fn()} />);
    expect(
      screen.queryByRole("button", { name: "Pulisci filtri" })
    ).not.toBeInTheDocument();
  });

  it("labels a single active filter as '1 filtro'", () => {
    render(<AttivitaFilterBar {...baseProps} aziendaId="az1" onChange={vi.fn()} />);
    expect(screen.getByText("1 filtro")).toBeInTheDocument();
  });

  it("labels multiple active filters with the plural 'filtri'", () => {
    render(
      <AttivitaFilterBar
        {...baseProps}
        aziendaId="az1"
        tipoId="ginecologia"
        vetUid="u-1"
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText("3 filtri")).toBeInTheDocument();
  });

  it("shows 'Nessun filtro' when nothing is active", () => {
    render(<AttivitaFilterBar {...baseProps} onChange={vi.fn()} />);
    expect(screen.getByText("Nessun filtro")).toBeInTheDocument();
  });

  it("exposes the quick-range chips as a labelled group with toggle state", () => {
    render(<AttivitaFilterBar {...baseProps} onChange={vi.fn()} />);
    const group = screen.getByRole("group", { name: "Periodo rapido" });
    expect(group).toBeInTheDocument();
    const oggi = screen.getByRole("button", { name: "Oggi", pressed: false });
    expect(oggi).toBeInTheDocument();
  });

  it("emits both from and to when a quick range is chosen", () => {
    const onChange = vi.fn();
    render(<AttivitaFilterBar {...baseProps} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Questo mese" }));
    const keys = onChange.mock.calls.map((c) => c[0]);
    expect(keys).toContain("from");
    expect(keys).toContain("to");
  });
});
