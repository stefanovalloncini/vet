import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { PageHeader } from "../PageHeader";

function wrap(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("PageHeader", () => {
  it("renders the title as h1", () => {
    wrap(<PageHeader title="Attività" />);
    expect(
      screen.getByRole("heading", { level: 1, name: /Attività/i })
    ).toBeInTheDocument();
  });

  it("renders the subtitle when provided", () => {
    wrap(<PageHeader title="X" subtitle="Sottotitolo descrittivo" />);
    expect(screen.getByText(/Sottotitolo descrittivo/i)).toBeInTheDocument();
  });

  it("does NOT render a subtitle paragraph when subtitle is missing", () => {
    wrap(<PageHeader title="X" />);
    const heading = screen.getByRole("heading", { level: 1 });
    // The heading's parent is the title block; no sibling <p> for subtitle.
    expect(heading.parentElement?.querySelector("p")).toBeNull();
  });

  it("renders the back link with arrow when back is provided", () => {
    wrap(<PageHeader title="X" back={{ to: "/lista", label: "Tutti" }} />);
    const link = screen.getByRole("link", { name: /Tutti/i });
    expect(link).toHaveAttribute("href", "/lista");
    expect(link.textContent).toMatch(/←/);
  });

  it("renders the actions slot", () => {
    wrap(<PageHeader title="X" actions={<button>Azione</button>} />);
    expect(screen.getByRole("button", { name: /Azione/i })).toBeInTheDocument();
  });

  it("renders a ReactNode subtitle (not just string)", () => {
    wrap(
      <PageHeader
        title="X"
        subtitle={<span data-testid="sub">subnode</span>}
      />
    );
    expect(screen.getByTestId("sub")).toBeInTheDocument();
  });
});
