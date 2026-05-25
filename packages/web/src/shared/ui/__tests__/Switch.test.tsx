import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Switch } from "../Switch";

describe("Switch", () => {
  it("renders a checkbox with the label as accessible name", () => {
    render(<Switch checked={false} onChange={() => {}} label="Notifiche" />);
    const cb = screen.getByRole("checkbox", { name: /Notifiche/i });
    expect(cb).toBeInTheDocument();
  });

  it("reflects the checked prop", () => {
    const { rerender } = render(
      <Switch checked={false} onChange={() => {}} label="X" />
    );
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    rerender(<Switch checked onChange={() => {}} label="X" />);
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("calls onChange with the next value when toggled", () => {
    const onChange = vi.fn();
    render(<Switch checked={false} onChange={onChange} label="X" />);
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("calls onChange with false when un-toggled", () => {
    const onChange = vi.fn();
    render(<Switch checked onChange={onChange} label="X" />);
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("disables the input when disabled is true", () => {
    render(<Switch checked={false} onChange={() => {}} label="X" disabled />);
    const cb = screen.getByRole("checkbox");
    expect(cb).toBeDisabled();
  });

  it("displays the visible label text", () => {
    render(<Switch checked={false} onChange={() => {}} label="Notifiche" />);
    expect(screen.getByText(/Notifiche/i)).toBeInTheDocument();
  });
});
