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

function installStorage(): void {
  const store = new Map<string, string>();
  const stub: Storage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key) {
      return store.has(key) ? (store.get(key) as string) : null;
    },
    key(i) {
      return Array.from(store.keys())[i] ?? null;
    },
    removeItem(key) {
      store.delete(key);
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
  };
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: stub,
  });
}

describe("App routing", () => {
  beforeEach(() => {
    installStorage();
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

  it("redirects a non-admin away from an admin-only route", async () => {
    window.history.pushState({}, "", "/admin/ruoli");
    const repos = createInMemoryRepositories();
    const actor: ActorContext = {
      uid: "u1",
      email: "vet@y.com",
      displayName: "Vet",
      roleId: "veterinario_semplice",
      caps: new Set(["activities.read.all", "aziende.read"]),
      approved: true,
    };
    (repos.auth as InMemoryAuthService).setSimulatedUser(actor);
    withRepos(repos);
    await waitFor(() => {
      expect(window.location.pathname.startsWith("/admin")).toBe(false);
    });
    expect(
      screen.queryByText(/Definizione capacità per ruolo/i)
    ).not.toBeInTheDocument();
  });

  it("lets an administrator open an admin-only route", async () => {
    window.history.pushState({}, "", "/admin/ruoli");
    const repos = createInMemoryRepositories();
    const actor: ActorContext = {
      uid: "admin",
      email: "admin@y.com",
      displayName: "Admin",
      roleId: "amministratore",
      caps: new Set(["roles.read", "activities.read.all", "aziende.read"]),
      approved: true,
    };
    (repos.auth as InMemoryAuthService).setSimulatedUser(actor);
    withRepos(repos);
    await waitFor(() => {
      expect(
        screen.getByText(/Definizione capacità per ruolo/i)
      ).toBeInTheDocument();
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
