import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ActorContext } from "@vet/shared";
import { InMemoryAuthService } from "@vet/shared/testing";
import { App } from "../App";
import { RepositoriesProvider } from "../infrastructure/RepositoriesContext";
import { createInMemoryRepositories } from "../infrastructure/composition/in-memory";

function withRepos(repos = createInMemoryRepositories()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  return render(
    <QueryClientProvider client={client}>
      <RepositoriesProvider value={repos}>
        <App />
      </RepositoriesProvider>
    </QueryClientProvider>
  );
}

describe("App routing", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("redirects unauthenticated users to /login", async () => {
    withRepos();
    await waitFor(() => {
      expect(screen.getByText(/Entra nel tuo account/)).toBeInTheDocument();
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
      approved: true,
    };
    (repos.auth as InMemoryAuthService).setSimulatedUser(actor);
    withRepos(repos);
    await waitFor(() => {
      expect(screen.getByText(/Pannello di controllo/)).toBeInTheDocument();
    });
  });

  it("renders fallback when used without RepositoriesProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<App />);
    expect(
      screen.getByText(/Si è verificato un errore caricando questa pagina/i)
    ).toBeInTheDocument();
    spy.mockRestore();
  });
});
