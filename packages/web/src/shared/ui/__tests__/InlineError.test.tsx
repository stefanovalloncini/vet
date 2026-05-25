import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InlineError } from "../InlineError";

describe("InlineError", () => {
  it("renders the text inside a role='alert' paragraph", () => {
    render(<InlineError>Errore di salvataggio</InlineError>);
    const alert = screen.getByRole("alert");
    expect(alert.tagName).toBe("P");
    expect(alert).toHaveTextContent(/Errore di salvataggio/i);
  });

  it("renders ReactNode children, not just strings", () => {
    render(
      <InlineError>
        <strong>Errore</strong>: campo obbligatorio
      </InlineError>
    );
    expect(screen.getByRole("alert").querySelector("strong")).not.toBeNull();
  });

  it("merges the className extra with default", () => {
    render(<InlineError className="mt-2">Boom</InlineError>);
    expect(screen.getByRole("alert").className).toContain("mt-2");
    expect(screen.getByRole("alert").className).toMatch(/danger/);
  });
});
