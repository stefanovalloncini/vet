import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ActorContext } from "@vet/shared";
import { InMemoryAuthService } from "@vet/shared/testing";
import { App } from "../App";
import { RepositoriesProvider } from "../infrastructure/RepositoriesContext";
import { createInMemoryRepositories } from "../infrastructure/composition/in-memory";

function withRepos(repos = createInMemoryRepositories()) {
  return render(
    <RepositoriesProvider value={repos}>
      <App />
    </RepositoriesProvider>
  );
}

describe("App routing", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("redirects unauthenticated users to /login", async () => {
    withRepos();
    await waitFor(() => {
      expect(screen.getByText(/Accedi al gestionale/)).toBeInTheDocument();
    });
  });

  it("shows home when signed in", async () => {
    const repos = createInMemoryRepositories();
    const actor: ActorContext = {
      uid: "u1",
      email: "x@y.com",
      displayName: "Stefano",
      roleId: "vet",
      caps: new Set(["aziende.read"]),
    };
    (repos.auth as InMemoryAuthService).setSimulatedUser(actor);
    withRepos(repos);
    await waitFor(() => {
      expect(screen.getByText(/Ciao Stefano/)).toBeInTheDocument();
    });
  });

  it("throws when used without RepositoriesProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<App />)).toThrow(/RepositoriesProvider/);
    spy.mockRestore();
  });
});
