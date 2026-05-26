import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoadingHint } from "../LoadingHint";

describe("LoadingHint", () => {
  it("renders the default 'Caricamento…' label", () => {
    render(<LoadingHint />);
    expect(screen.getByText(/Caricamento…/i)).toBeInTheDocument();
  });

  it("renders a custom label", () => {
    render(<LoadingHint label="Sto caricando i dati" />);
    expect(screen.getByText(/Sto caricando i dati/i)).toBeInTheDocument();
  });

  it("exposes a polite status role", () => {
    render(<LoadingHint />);
    const statuses = screen.getAllByRole("status");
    expect(statuses.length).toBeGreaterThan(0);
    expect(statuses[0]).toHaveAttribute("aria-live", "polite");
  });

  it("merges className with the default classes", () => {
    const { container } = render(<LoadingHint className="mt-2" />);
    const root = container.firstElementChild as HTMLElement | null;
    expect(root?.className).toContain("mt-2");
    expect(root?.className).toMatch(/text-/);
  });
});
