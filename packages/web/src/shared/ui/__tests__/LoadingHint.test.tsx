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

  it("merges className with the default text classes", () => {
    const { container } = render(<LoadingHint className="mt-2" />);
    const p = container.querySelector("p");
    expect(p?.className).toContain("mt-2");
    expect(p?.className).toMatch(/text-/);
  });
});
