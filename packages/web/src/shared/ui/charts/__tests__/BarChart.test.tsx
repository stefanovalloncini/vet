import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BarChart } from "../BarChart";

function fillWidths(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll("li [style]")).map(
    (el) => (el as HTMLElement).style.width
  );
}

describe("BarChart", () => {
  it("renders no rows for an empty series", () => {
    const { container } = render(<BarChart bars={[]} />);
    expect(container.querySelectorAll("li")).toHaveLength(0);
  });

  it("does not divide by zero when every value is zero", () => {
    const { container } = render(
      <BarChart
        bars={[
          { label: "a", value: 0 },
          { label: "b", value: 0 },
        ]}
      />
    );
    expect(fillWidths(container)).toEqual(["0%", "0%"]);
  });

  it("scales the largest bar to 100% and others proportionally", () => {
    const { container } = render(
      <BarChart
        bars={[
          { label: "a", value: 5 },
          { label: "b", value: 10 },
        ]}
      />
    );
    expect(fillWidths(container)).toEqual(["50%", "100%"]);
  });

  it("applies formatValue when provided", () => {
    render(<BarChart bars={[{ label: "a", value: 1234 }]} formatValue={(n) => `€${n}`} />);
    expect(screen.getByText("€1234")).toBeInTheDocument();
  });
});
