import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SectionLabel } from "../SectionLabel";

describe("SectionLabel", () => {
  it("renders the text as a <p> by default", () => {
    render(<SectionLabel>Account</SectionLabel>);
    const el = screen.getByText(/Account/i);
    expect(el.tagName).toBe("P");
  });

  it("renders as an arbitrary tag via the `as` prop", () => {
    render(<SectionLabel as="h2">Sezione</SectionLabel>);
    const el = screen.getByRole("heading", { level: 2, name: /Sezione/i });
    expect(el).toBeInTheDocument();
  });

  it("applies uppercase + tracking-wider default styling", () => {
    render(<SectionLabel>X</SectionLabel>);
    const el = screen.getByText(/X/);
    expect(el.className).toContain("uppercase");
    expect(el.className).toContain("tracking-wider");
  });

  it("merges custom className", () => {
    render(<SectionLabel className="mt-4">X</SectionLabel>);
    expect(screen.getByText(/X/).className).toContain("mt-4");
  });

  it("renders ReactNode children", () => {
    render(
      <SectionLabel>
        <span data-testid="inner">testo</span>
      </SectionLabel>
    );
    expect(screen.getByTestId("inner")).toBeInTheDocument();
  });
});
