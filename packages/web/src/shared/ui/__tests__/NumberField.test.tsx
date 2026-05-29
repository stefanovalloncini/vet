import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { NumberField } from "../NumberField";

function Harness({
  initial = 5,
  step,
  min,
  max,
}: {
  initial?: number | "";
  step?: number;
  min?: number;
  max?: number;
}) {
  const [v, setV] = useState<number | "">(initial);
  return (
    <NumberField
      id="tariffa"
      label="Tariffa"
      value={v}
      onChange={setV}
      {...(step !== undefined ? { step } : {})}
      {...(min !== undefined ? { min } : {})}
      {...(max !== undefined ? { max } : {})}
    />
  );
}

describe("NumberField", () => {
  it("renders label and bound input value", () => {
    render(<Harness initial={42} />);
    const input = screen.getByLabelText("Tariffa") as HTMLInputElement;
    expect(input.value).toBe("42");
  });

  it("never shows native spinner arrows: input declares appearance via global rule", () => {
    render(<Harness initial={3} />);
    const input = screen.getByLabelText("Tariffa") as HTMLInputElement;
    expect(input.type).toBe("number");
    expect(input).toHaveAttribute("inputmode", "decimal");
  });

  it("renders custom stepper buttons in Italian", () => {
    render(<Harness initial={1} />);
    expect(screen.getByRole("button", { name: "Aumenta" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Diminuisci" })).toBeInTheDocument();
  });

  it("increments the value by step on click of Aumenta", () => {
    render(<Harness initial={2} step={5} />);
    fireEvent.click(screen.getByRole("button", { name: "Aumenta" }));
    expect((screen.getByLabelText("Tariffa") as HTMLInputElement).value).toBe("7");
  });

  it("decrements the value by step on click of Diminuisci", () => {
    render(<Harness initial={10} step={2} />);
    fireEvent.click(screen.getByRole("button", { name: "Diminuisci" }));
    expect((screen.getByLabelText("Tariffa") as HTMLInputElement).value).toBe("8");
  });

  it("respects min when decrementing", () => {
    render(<Harness initial={1} step={5} min={0} />);
    fireEvent.click(screen.getByRole("button", { name: "Diminuisci" }));
    expect((screen.getByLabelText("Tariffa") as HTMLInputElement).value).toBe("0");
  });

  it("respects max when incrementing", () => {
    render(<Harness initial={9} step={5} max={10} />);
    fireEvent.click(screen.getByRole("button", { name: "Aumenta" }));
    expect((screen.getByLabelText("Tariffa") as HTMLInputElement).value).toBe("10");
  });

  it("disables Diminuisci when at min", () => {
    render(<Harness initial={0} min={0} />);
    expect(screen.getByRole("button", { name: "Diminuisci" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Aumenta" })).not.toBeDisabled();
  });

  it("disables Aumenta when at max", () => {
    render(<Harness initial={10} max={10} />);
    expect(screen.getByRole("button", { name: "Aumenta" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Diminuisci" })).not.toBeDisabled();
  });

  it("disables both steppers when input is disabled", () => {
    render(<NumberField id="x" label="X" value={3} onChange={() => {}} disabled />);
    expect(screen.getByRole("button", { name: "Aumenta" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Diminuisci" })).toBeDisabled();
  });

  it("calls onChange with parsed number on input change", () => {
    const onChange = vi.fn();
    render(<NumberField id="x" label="X" value={1} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("X"), { target: { value: "12" } });
    expect(onChange).toHaveBeenCalledWith(12);
  });

  it("calls onChange with empty string when input cleared", () => {
    const onChange = vi.fn();
    render(<NumberField id="x" label="X" value={1} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("X"), { target: { value: "" } });
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("renders error in role=alert and skips hint", () => {
    render(
      <NumberField id="x" label="X" value={1} onChange={() => {}} error="Fuori limite" hint="non visibile" />
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Fuori limite");
    expect(screen.queryByText("non visibile")).toBeNull();
  });

  it("renders hint when no error", () => {
    render(<NumberField id="x" label="X" value={1} onChange={() => {}} hint="Step 0,25" />);
    expect(screen.getByText("Step 0,25")).toBeInTheDocument();
  });

  it("renders suffix when provided", () => {
    render(<NumberField id="x" label="X" value={1} onChange={() => {}} suffix="EUR" />);
    expect(screen.getByText("EUR")).toBeInTheDocument();
  });

  it("adds step to the current value preserving fractional decimals", () => {
    render(<Harness initial={1.25} step={0.25} />);
    fireEvent.click(screen.getByRole("button", { name: "Aumenta" }));
    expect((screen.getByLabelText("Tariffa") as HTMLInputElement).value).toBe("1.5");
  });

  it("avoids floating-point drift on fractional steps", () => {
    render(<Harness initial={0.1} step={0.2} />);
    fireEvent.click(screen.getByRole("button", { name: "Aumenta" }));
    expect((screen.getByLabelText("Tariffa") as HTMLInputElement).value).toBe("0.3");
  });

  it("sets native step to any so typed non-multiples never step-mismatch", () => {
    render(<Harness initial="" step={10} />);
    const input = screen.getByLabelText("Tariffa") as HTMLInputElement;
    expect(input).toHaveAttribute("step", "any");
    fireEvent.change(input, { target: { value: "49,50" } });
    expect(input.validity.stepMismatch).toBe(false);
    fireEvent.change(input, { target: { value: "1" } });
    expect(input.validity.stepMismatch).toBe(false);
  });

  it("arrows step by 10 by default while the input keeps any typed value", () => {
    render(<Harness initial={1} />);
    fireEvent.click(screen.getByRole("button", { name: "Aumenta" }));
    expect((screen.getByLabelText("Tariffa") as HTMLInputElement).value).toBe("11");
  });
});
