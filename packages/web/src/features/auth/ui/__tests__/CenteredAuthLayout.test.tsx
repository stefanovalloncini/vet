import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CenteredAuthLayout } from "../CenteredAuthLayout";

afterEach(() => {
  document.documentElement.removeAttribute("data-theme");
});

describe("CenteredAuthLayout", () => {
  it("renders the title as the single h1", () => {
    render(
      <CenteredAuthLayout title="Entra nel tuo account">
        <p>contenuto</p>
      </CenteredAuthLayout>
    );
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent("Entra nel tuo account");
  });

  it("renders the optional subtitle", () => {
    render(
      <CenteredAuthLayout title="Richiedi accesso" subtitle="Compila il modulo.">
        <p>contenuto</p>
      </CenteredAuthLayout>
    );
    expect(screen.getByText("Compila il modulo.")).toBeInTheDocument();
  });

  it("renders the children inside the layout", () => {
    render(
      <CenteredAuthLayout title="Titolo">
        <button type="button">Azione</button>
      </CenteredAuthLayout>
    );
    expect(screen.getByRole("button", { name: "Azione" })).toBeInTheDocument();
  });

  it("exposes a labelled theme toggle with a comfortable touch target", () => {
    render(
      <CenteredAuthLayout title="Titolo">
        <p>contenuto</p>
      </CenteredAuthLayout>
    );
    const toggle = screen.getByRole("button", { name: /Tema/i });
    expect(toggle.className).toMatch(/h-11/);
    expect(toggle.className).toMatch(/w-11/);
  });

  it("flips the theme attribute when the toggle is pressed", () => {
    render(
      <CenteredAuthLayout title="Titolo">
        <p>contenuto</p>
      </CenteredAuthLayout>
    );
    const before = document.documentElement.getAttribute("data-theme");
    fireEvent.click(screen.getByRole("button", { name: /Tema/i }));
    expect(document.documentElement.getAttribute("data-theme")).not.toBe(before);
  });
});
