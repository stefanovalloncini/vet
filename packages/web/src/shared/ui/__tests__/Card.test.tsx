import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card } from "../Card";

describe("Card", () => {
  it("renders children", () => {
    render(<Card>Contenuto</Card>);
    expect(screen.getByText("Contenuto")).toBeInTheDocument();
  });

  it("applies default md padding", () => {
    render(<Card>X</Card>);
    expect(screen.getByText("X").className).toContain("p-4");
  });

  it("supports padding=sm", () => {
    render(<Card padding="sm">X</Card>);
    expect(screen.getByText("X").className).toContain("p-3");
  });

  it("supports padding=lg", () => {
    render(<Card padding="lg">X</Card>);
    expect(screen.getByText("X").className).toContain("p-6");
  });

  it("omits padding when padded=false", () => {
    const { container } = render(<Card padded={false}>X</Card>);
    expect(container.firstChild).not.toHaveClass("p-4");
    expect(container.firstChild).not.toHaveClass("p-6");
  });

  it("applies soft shadow when elevated", () => {
    const { container } = render(<Card elevated>X</Card>);
    const cls = (container.firstChild as HTMLElement).className;
    expect(cls).toContain("shadow-");
  });

  it("forwards extra className", () => {
    const { container } = render(<Card className="custom">X</Card>);
    expect((container.firstChild as HTMLElement).className).toContain("custom");
  });
});
