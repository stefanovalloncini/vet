import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { App } from "../App";
import { RepositoriesProvider } from "../infrastructure/RepositoriesContext";
import { createInMemoryRepositories } from "../infrastructure/composition/in-memory";

function renderWithRepos() {
  render(
    <RepositoriesProvider value={createInMemoryRepositories()}>
      <App />
    </RepositoriesProvider>
  );
}

describe("App", () => {
  it("renders the app title", () => {
    renderWithRepos();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Vet");
  });

  it("renders the clock tick from useRepositories", () => {
    renderWithRepos();
    expect(screen.getByText(/Clock tick:/)).toBeInTheDocument();
  });

  it("throws when used without RepositoriesProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<App />)).toThrow(/RepositoriesProvider/);
    spy.mockRestore();
  });
});
