import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Select } from "../Select";

const options = [
  { value: "a", label: "Alfa" },
  { value: "b", label: "Bravo" },
];

describe("Select", () => {
  it("renders label, options, and selected value", () => {
    render(<Select id="s" label="Scelta" options={options} defaultValue="b" />);
    const select = screen.getByLabelText("Scelta") as HTMLSelectElement;
    expect(select.value).toBe("b");
    expect(screen.getByRole("option", { name: "Alfa" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Bravo" })).toBeInTheDocument();
  });

  it("calls onChange when user selects an option", () => {
    const onChange = vi.fn();
    render(<Select id="s" label="X" options={options} value="a" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("X"), { target: { value: "b" } });
    expect(onChange).toHaveBeenCalled();
  });

  it("renders error with role=alert", () => {
    render(<Select id="s" label="X" options={options} error="Scegli un valore" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Scegli un valore");
  });

  it("renders hint when no error", () => {
    render(<Select id="s" label="X" options={options} hint="Suggerimento" />);
    expect(screen.getByText("Suggerimento")).toBeInTheDocument();
  });

  it("applies 44px touch height", () => {
    render(<Select id="s" label="X" options={options} />);
    expect((screen.getByLabelText("X") as HTMLSelectElement).className).toContain("h-11");
  });

  it("renders optional action node next to label", () => {
    render(
      <Select
        id="s"
        label="X"
        options={options}
        action={<button type="button">Nuovo</button>}
      />
    );
    expect(screen.getByRole("button", { name: "Nuovo" })).toBeInTheDocument();
  });
});
