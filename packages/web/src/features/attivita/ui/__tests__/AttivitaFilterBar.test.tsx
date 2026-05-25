import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AttivitaFilterBar } from "../AttivitaFilterBar";

const baseProps = {
  from: "",
  to: "",
  aziendaId: "",
  tipoId: "",
  vetUid: "",
  group: "none" as const,
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
  groupOptions: [
    { value: "none", label: "Nessuno" },
    { value: "azienda", label: "Azienda" },
    { value: "vet", label: "Veterinario" },
  ],
  canExport: false,
  onExport: vi.fn(),
  onClearAll: vi.fn(),
};

describe("AttivitaFilterBar", () => {
  it("renders all 6 controls on desktop", () => {
    const onChange = vi.fn();
    render(<AttivitaFilterBar {...baseProps} onChange={onChange} />);
    expect(screen.getByLabelText("Da")).toBeInTheDocument();
    expect(screen.getByLabelText("A")).toBeInTheDocument();
    expect(screen.getByLabelText("Azienda")).toBeInTheDocument();
    expect(screen.getByLabelText("Tipo")).toBeInTheDocument();
    expect(screen.getByLabelText("Veterinario")).toBeInTheDocument();
    expect(screen.getByLabelText("Raggruppa per")).toBeInTheDocument();
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

  it("shows export icon-button when canExport is true", () => {
    const onExport = vi.fn();
    render(
      <AttivitaFilterBar
        {...baseProps}
        canExport
        onExport={onExport}
        onChange={vi.fn()}
      />
    );
    const exportButtons = screen.getAllByLabelText("Esporta CSV");
    expect(exportButtons.length).toBeGreaterThan(0);
    fireEvent.click(exportButtons[0]!);
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it("hides export button when canExport is false", () => {
    render(<AttivitaFilterBar {...baseProps} onChange={vi.fn()} />);
    expect(screen.queryByLabelText("Esporta CSV")).not.toBeInTheDocument();
  });
});
