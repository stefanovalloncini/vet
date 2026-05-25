import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Spinner } from "../Spinner";

describe("Spinner", () => {
  it("renders a status role with default aria-label 'Caricamento'", () => {
    render(<Spinner />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-label", "Caricamento");
    expect(status).toHaveAttribute("aria-live", "polite");
  });

  it("uses the provided label as both aria-label and visible text", () => {
    render(<Spinner label="Sto caricando…" />);
    const status = screen.getByRole("status", { name: /Sto caricando/i });
    expect(status).toBeInTheDocument();
    expect(screen.getByText(/Sto caricando…/i)).toBeInTheDocument();
  });

  it("does not render a visible text span when label is omitted", () => {
    render(<Spinner />);
    const status = screen.getByRole("status");
    const visibleText = status.querySelector("span");
    expect(visibleText).toBeNull();
  });

  it("respects custom size prop via SVG size", () => {
    const { container } = render(<Spinner size={32} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "32");
    expect(svg).toHaveAttribute("height", "32");
  });
});
