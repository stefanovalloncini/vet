import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { SegmentedControl } from "../SegmentedControl";

const segments = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
  { value: "c", label: "Gamma" },
] as const;

function Harness({
  initial = "a",
  onPick,
}: {
  initial?: string;
  onPick?: (v: string) => void;
}) {
  const [v, setV] = useState(initial);
  return (
    <SegmentedControl
      label="Test"
      value={v}
      onChange={(next) => {
        setV(next);
        onPick?.(next);
      }}
      segments={segments}
    />
  );
}

describe("SegmentedControl", () => {
  it("renders all segments as radios", () => {
    render(<Harness />);
    expect(screen.getByRole("radio", { name: "Alpha" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Beta" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Gamma" })).toBeInTheDocument();
  });

  it("marks the active segment with aria-checked=true", () => {
    render(<Harness initial="b" />);
    expect(screen.getByRole("radio", { name: "Beta" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    expect(screen.getByRole("radio", { name: "Alpha" })).toHaveAttribute(
      "aria-checked",
      "false"
    );
  });

  it("calls onChange when a segment is clicked", () => {
    const onPick = vi.fn();
    render(<Harness onPick={onPick} />);
    fireEvent.click(screen.getByRole("radio", { name: "Gamma" }));
    expect(onPick).toHaveBeenCalledWith("c");
  });

  it("groups segments via role=radiogroup with the label", () => {
    render(<Harness />);
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
    expect(screen.getByText("Test")).toBeInTheDocument();
  });

  it("renders an error message with role=alert when error is set", () => {
    render(
      <SegmentedControl
        label="Test"
        value="a"
        onChange={() => {}}
        segments={segments}
        error="Selezione obbligatoria"
      />
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Selezione obbligatoria"
    );
  });
});
