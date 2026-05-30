import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Sparkline } from "../Sparkline";

function points(container: HTMLElement): string {
  return container.querySelector("polyline")?.getAttribute("points") ?? "";
}

describe("Sparkline", () => {
  it("renders nothing for an empty series", () => {
    const { container } = render(<Sparkline values={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders a single-point series without dividing by zero", () => {
    const { container } = render(<Sparkline values={[5]} />);
    expect(container.querySelector("polyline")).not.toBeNull();
    expect(points(container)).not.toContain("NaN");
  });

  it("produces one point per value with no NaN for a flat series", () => {
    const { container } = render(
      <Sparkline values={[3, 3, 3]} width={100} height={50} />
    );
    expect(points(container).split(" ")).toHaveLength(3);
    expect(points(container)).not.toContain("NaN");
  });

  it("shows edge labels only when labels match the value count", () => {
    const { rerender } = render(
      <Sparkline values={[1, 2, 3]} labels={["gen", "mar"]} />
    );
    expect(screen.queryByText("gen")).toBeNull();
    rerender(<Sparkline values={[1, 2, 3]} labels={["gen", "feb", "mar"]} />);
    expect(screen.getByText("gen")).toBeInTheDocument();
    expect(screen.getByText("mar")).toBeInTheDocument();
  });
});
