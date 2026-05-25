import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AttivitaViewToolbar } from "../AttivitaViewToolbar";

const baseProps = {
  group: "none" as const,
  groupOptions: [
    { value: "none", label: "Nessuno" },
    { value: "azienda", label: "Azienda" },
    { value: "vet", label: "Veterinario" },
  ],
  canExport: false,
  onChange: vi.fn(),
  onExport: vi.fn(),
};

describe("AttivitaViewToolbar", () => {
  it("renders the Raggruppa select with the current value", () => {
    render(<AttivitaViewToolbar {...baseProps} group="azienda" />);
    const select = screen.getByLabelText("Raggruppa per") as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    expect(select.value).toBe("azienda");
  });

  it("emits onChange with 'group' when the dropdown changes", () => {
    const onChange = vi.fn();
    render(<AttivitaViewToolbar {...baseProps} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Raggruppa per"), {
      target: { value: "vet" },
    });
    expect(onChange).toHaveBeenCalledWith("group", "vet");
  });

  it("shows the export button when canExport is true", () => {
    const onExport = vi.fn();
    render(
      <AttivitaViewToolbar {...baseProps} canExport onExport={onExport} />
    );
    const button = screen.getByLabelText("Esporta CSV");
    fireEvent.click(button);
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it("hides the export button when canExport is false", () => {
    render(<AttivitaViewToolbar {...baseProps} canExport={false} />);
    expect(screen.queryByLabelText("Esporta CSV")).not.toBeInTheDocument();
  });
});
