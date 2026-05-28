import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { PrivacyPage } from "../PrivacyPage";

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/privacy"]}>
      <PrivacyPage />
    </MemoryRouter>
  );
}

describe("PrivacyPage", () => {
  it("renders exactly one h1", () => {
    renderPage();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Informativa sul trattamento dei dati personali/i,
      })
    ).toBeInTheDocument();
  });

  it("renders the main legal sections as h2 headings", () => {
    renderPage();
    for (const title of [
      "Titolare del trattamento",
      "Dati trattati e finalità",
      "Conservazione",
      "Diritti dell'interessato",
      "Cookie e tecnologie analoghe",
    ]) {
      expect(
        screen.getByRole("heading", { level: 2, name: title })
      ).toBeInTheDocument();
    }
  });

  it("exposes the contact mailto links", () => {
    renderPage();
    const mailtos = screen
      .getAllByRole("link")
      .filter((a) => a.getAttribute("href")?.startsWith("mailto:"));
    expect(mailtos.length).toBeGreaterThan(0);
    expect(mailtos[0]).toHaveAttribute(
      "href",
      "mailto:stefano.valloncini@gmail.com"
    );
  });

  it("gives every anchor a visible focus style", () => {
    renderPage();
    const anchors = screen
      .getAllByRole("link")
      .filter((a) => a.tagName === "A" && a.getAttribute("href") !== "/login");
    for (const a of anchors) {
      expect(a.className).toMatch(/focus-visible:/);
    }
  });

  it("opens the Garante link safely in a new tab", () => {
    renderPage();
    const external = screen.getByRole("link", { name: /garanteprivacy\.it/i });
    expect(external).toHaveAttribute("target", "_blank");
    expect(external).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("constrains the body to a readable measure", () => {
    const { container } = renderPage();
    expect(container.querySelector(".max-w-prose")).not.toBeNull();
  });
});
