import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TrailingBarChart } from "../TrailingBarChart";

const fmt = (v: number) => String(v);

describe("TrailingBarChart", () => {
  it("renders nothing for an empty series", () => {
    const { container } = render(
      <TrailingBarChart values={[]} labels={[]} formatValue={fmt} totalLabel="Tot" />
    );
    expect(container.firstChild).toBeNull();
  });

  it("does not divide by zero on an all-zero series (new user)", () => {
    render(
      <TrailingBarChart
        values={[0, 0, 0]}
        labels={["gen", "feb", "mar"]}
        formatValue={fmt}
        totalLabel="Tot"
      />
    );
    const bars = screen.getAllByLabelText(/: 0$/);
    expect(bars).toHaveLength(3);
    for (const bar of bars) {
      expect((bar as HTMLElement).style.height).toBe("2%");
    }
  });

  it("scales the peak bar to full height and others proportionally", () => {
    render(
      <TrailingBarChart
        values={[5, 10, 5]}
        labels={["a", "b", "c"]}
        formatValue={fmt}
        totalLabel="Tot"
      />
    );
    expect((screen.getByLabelText("b: 10") as HTMLElement).style.height).toBe(
      "100%"
    );
    expect((screen.getByLabelText("a: 5") as HTMLElement).style.height).toBe(
      "50%"
    );
  });

  it("shows the formatted total of the series", () => {
    render(
      <TrailingBarChart
        values={[2, 3]}
        labels={["a", "b"]}
        formatValue={fmt}
        totalLabel="Totale"
      />
    );
    expect(screen.getByText("Totale")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });
});
