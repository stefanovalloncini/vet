import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RetentionSettings } from "../RetentionSettings";

describe("RetentionSettings", () => {
  it("shows the current value in display mode", () => {
    render(<RetentionSettings value={7} onChange={vi.fn()} />);
    expect(screen.getByText("7 giorni")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Modifica/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/Giorni/i)).toBeNull();
  });

  it("uses the singular form for 1", () => {
    render(<RetentionSettings value={1} onChange={vi.fn()} />);
    expect(screen.getByText("1 giorno")).toBeInTheDocument();
  });

  it("enters edit mode and emits the parsed value on Salva", () => {
    const onChange = vi.fn();
    render(<RetentionSettings value={7} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /Modifica/i }));
    const input = screen.getByLabelText(/Giorni/i) as HTMLInputElement;
    expect(input.value).toBe("7");
    fireEvent.change(input, { target: { value: "14" } });
    fireEvent.click(screen.getByRole("button", { name: /^Salva$/i }));
    expect(onChange).toHaveBeenCalledWith(14);
  });

  it("disables Salva when the value is unchanged", () => {
    render(<RetentionSettings value={7} onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Modifica/i }));
    expect(screen.getByRole("button", { name: /^Salva$/i })).toBeDisabled();
  });

  it("blocks Salva when value is out of range and shows the bounds", () => {
    render(<RetentionSettings value={7} onChange={vi.fn()} min={1} max={30} />);
    fireEvent.click(screen.getByRole("button", { name: /Modifica/i }));
    fireEvent.change(screen.getByLabelText(/Giorni/i), {
      target: { value: "100" },
    });
    expect(screen.getByRole("button", { name: /^Salva$/i })).toBeDisabled();
    expect(screen.getByText(/Tra 1 e 30/)).toBeInTheDocument();
  });

  it("reverts the draft when Annulla is clicked", () => {
    const onChange = vi.fn();
    render(<RetentionSettings value={7} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /Modifica/i }));
    fireEvent.change(screen.getByLabelText(/Giorni/i), {
      target: { value: "21" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Annulla/i }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText("7 giorni")).toBeInTheDocument();
  });

  it("commits the value on Enter", () => {
    const onChange = vi.fn();
    render(<RetentionSettings value={7} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /Modifica/i }));
    const input = screen.getByLabelText(/Giorni/i);
    fireEvent.change(input, { target: { value: "10" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith(10);
  });

  it("cancels the edit on Escape", () => {
    const onChange = vi.fn();
    render(<RetentionSettings value={7} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /Modifica/i }));
    const input = screen.getByLabelText(/Giorni/i);
    fireEvent.change(input, { target: { value: "21" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText("7 giorni")).toBeInTheDocument();
  });

  it("disables the edit button when busy", () => {
    render(<RetentionSettings value={7} onChange={vi.fn()} busy />);
    expect(screen.getByRole("button", { name: /Modifica/i })).toBeDisabled();
  });
});
