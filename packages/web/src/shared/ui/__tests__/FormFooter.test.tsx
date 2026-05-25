import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormFooter } from "../FormFooter";

describe("FormFooter", () => {
  it("renders the actions slot", () => {
    render(<FormFooter actions={<button>Salva</button>} />);
    expect(screen.getByRole("button", { name: /Salva/i })).toBeInTheDocument();
  });

  it("renders the destructive slot when provided", () => {
    render(
      <FormFooter
        actions={<button>Salva</button>}
        destructive={<button>Elimina</button>}
      />
    );
    expect(screen.getByRole("button", { name: /Elimina/i })).toBeInTheDocument();
  });

  it("renders both slots together", () => {
    render(
      <FormFooter
        actions={
          <>
            <button>Annulla</button>
            <button>Salva</button>
          </>
        }
        destructive={<button>Elimina</button>}
      />
    );
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });

  it("does not crash when destructive is omitted", () => {
    render(<FormFooter actions={<button>X</button>} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
