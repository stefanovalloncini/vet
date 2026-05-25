import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SettingsRow } from "../SettingsRow";

describe("SettingsRow", () => {
  it("renders label as <p> when htmlFor is not provided", () => {
    render(
      <SettingsRow label="Tema">
        <button>Cambia</button>
      </SettingsRow>
    );
    const label = screen.getByText(/Tema/i);
    expect(label.tagName).toBe("P");
  });

  it("renders label as <label htmlFor> when htmlFor is provided", () => {
    render(
      <SettingsRow label="Cestino" htmlFor="trash-days">
        <input id="trash-days" />
      </SettingsRow>
    );
    const input = screen.getByLabelText(/Cestino/i);
    expect(input).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <SettingsRow label="X" description="testo descrittivo">
        <span>ctrl</span>
      </SettingsRow>
    );
    expect(screen.getByText(/testo descrittivo/i)).toBeInTheDocument();
  });

  it("renders ReactNode description (not just string)", () => {
    render(
      <SettingsRow
        label="X"
        description={<span data-testid="desc">descrizione node</span>}
      >
        <span>ctrl</span>
      </SettingsRow>
    );
    expect(screen.getByTestId("desc")).toBeInTheDocument();
  });

  it("renders the right-side children control", () => {
    render(
      <SettingsRow label="X">
        <button>Action</button>
      </SettingsRow>
    );
    expect(screen.getByRole("button", { name: /Action/i })).toBeInTheDocument();
  });
});
