import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Brand, BrandMark } from "../Brand";

describe("Brand", () => {
  it("renders the wordmark 'Veterinario' and the logo", () => {
    render(<Brand />);
    expect(screen.getByText(/Veterinario/i)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Veterinario logo/i })).toBeInTheDocument();
  });

  it("applies medium size by default", () => {
    const { container } = render(<Brand />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "22");
  });

  it("supports size='sm' and 'lg' with different SVG dimensions", () => {
    const { container: sm } = render(<Brand size="sm" />);
    expect(sm.querySelector("svg")).toHaveAttribute("width", "18");
    const { container: lg } = render(<Brand size="lg" />);
    expect(lg.querySelector("svg")).toHaveAttribute("width", "28");
  });
});

describe("BrandMark", () => {
  it("renders an SVG with role='img' and accessible name", () => {
    render(<BrandMark />);
    expect(screen.getByRole("img", { name: /Veterinario logo/i })).toBeInTheDocument();
  });

  it("respects the size prop", () => {
    const { container } = render(<BrandMark size={32} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "32");
    expect(svg).toHaveAttribute("height", "32");
  });
});
