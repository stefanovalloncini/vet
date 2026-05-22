import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RetentionSettings } from "../RetentionSettings";

describe("RetentionSettings", () => {
  it("starts with the current value and disables save", () => {
    render(<RetentionSettings value={7} onChange={vi.fn()} />);
    const input = screen.getByLabelText(/Giorni/i) as HTMLInputElement;
    expect(input.value).toBe("7");
    expect(screen.getByRole("button", { name: /Salva/i })).toBeDisabled();
  });

  it("enables save once the draft differs and emits the parsed value", () => {
    const onChange = vi.fn();
    render(<RetentionSettings value={7} onChange={onChange} />);
    const input = screen.getByLabelText(/Giorni/i);
    fireEvent.change(input, { target: { value: "14" } });
    const save = screen.getByRole("button", { name: /Salva/i });
    expect(save).not.toBeDisabled();
    fireEvent.click(save);
    expect(onChange).toHaveBeenCalledWith(14);
  });

  it("blocks save when value is out of range", () => {
    render(<RetentionSettings value={7} onChange={vi.fn()} min={1} max={30} />);
    fireEvent.change(screen.getByLabelText(/Giorni/i), {
      target: { value: "100" },
    });
    expect(screen.getByRole("button", { name: /Salva/i })).toBeDisabled();
    expect(screen.getByText(/Tra 1 e 30/)).toBeInTheDocument();
  });

  it("disables controls and shows pending label when busy", () => {
    render(<RetentionSettings value={7} onChange={vi.fn()} busy />);
    expect(screen.getByLabelText(/Giorni/i)).toBeDisabled();
    expect(screen.getByRole("button", { name: /Salvataggio…/i })).toBeDisabled();
  });
});
