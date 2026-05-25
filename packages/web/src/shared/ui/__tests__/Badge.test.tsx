import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "../Badge";

describe("Badge", () => {
  it("renders label children", () => {
    render(<Badge>Saldato</Badge>);
    expect(screen.getByText("Saldato")).toBeInTheDocument();
  });

  it("applies success tone classes", () => {
    render(<Badge tone="success">S</Badge>);
    expect(screen.getByText("S").className).toContain("text-(--color-success)");
  });

  it("applies danger tone classes", () => {
    render(<Badge tone="danger">D</Badge>);
    expect(screen.getByText("D").className).toContain("text-(--color-danger)");
  });

  it("applies warning tone classes", () => {
    render(<Badge tone="warning">W</Badge>);
    expect(screen.getByText("W").className).toContain("text-(--color-warning)");
  });

  it("applies neutral tone classes (default)", () => {
    render(<Badge>N</Badge>);
    expect(screen.getByText("N").className).toContain("text-(--color-text-muted)");
  });

  it("renders dot-only when dot=true and no children", () => {
    const { container } = render(<Badge dot tone="success" aria-label="Stato saldato" />);
    const dot = container.querySelector("span");
    expect(dot).toBeTruthy();
    expect(dot?.className).toContain("rounded-full");
    expect(dot).toHaveAttribute("aria-label", "Stato saldato");
  });

  it("renders dot beside text when dot=true with children", () => {
    render(<Badge dot tone="success">Saldato</Badge>);
    expect(screen.getByText("Saldato")).toBeInTheDocument();
    const badge = screen.getByText("Saldato").parentElement;
    expect(badge?.querySelectorAll("span").length).toBeGreaterThan(0);
  });

  it("applies size md padding", () => {
    render(<Badge size="md">M</Badge>);
    expect(screen.getByText("M").className).toContain("px-2");
  });
});
