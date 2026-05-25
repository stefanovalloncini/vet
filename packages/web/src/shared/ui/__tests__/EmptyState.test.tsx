import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "../EmptyState";

describe("EmptyState", () => {
  it("renders the title", () => {
    render(<EmptyState title="Nessun elemento" />);
    expect(screen.getByText(/Nessun elemento/i)).toBeInTheDocument();
  });

  it("renders the optional description when provided", () => {
    render(
      <EmptyState
        title="X"
        description="Aggiungi il primo elemento dal pulsante in alto a destra."
      />
    );
    expect(screen.getByText(/Aggiungi il primo elemento/i)).toBeInTheDocument();
  });

  it("does not render description container when omitted", () => {
    const { container } = render(<EmptyState title="X" />);
    expect(container.querySelectorAll("p")).toHaveLength(1);
  });

  it("renders the optional action node", () => {
    render(
      <EmptyState title="X" action={<button>Aggiungi</button>} />
    );
    expect(
      screen.getByRole("button", { name: /Aggiungi/i })
    ).toBeInTheDocument();
  });

  it("renders the optional icon node", () => {
    render(
      <EmptyState
        title="X"
        icon={<span data-testid="icon">icon</span>}
      />
    );
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });
});
