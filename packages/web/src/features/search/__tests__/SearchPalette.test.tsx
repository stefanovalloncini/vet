import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import type { ActorContext, Capability, Repositories } from "@vet/shared";
import { InMemoryAuthService } from "@vet/shared/testing";
import { SearchPalette } from "../SearchPalette";
import { RepositoriesProvider } from "../../../infrastructure/RepositoriesContext";
import { createInMemoryRepositories } from "../../../infrastructure/composition/in-memory";

function makeClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
    },
  });
}

function makeActor(caps: Capability[]): ActorContext {
  return {
    uid: "u1",
    email: "vet@example.com",
    displayName: "Mario",
    roleId: "vet",
    caps: new Set(caps),
    approved: true,
  };
}

interface MountOptions {
  repos?: Repositories;
  client?: QueryClient;
}

function mountPalette(opts: MountOptions = {}) {
  const repos = opts.repos ?? createInMemoryRepositories();
  const client = opts.client ?? makeClient();
  return {
    repos,
    client,
    ...render(
      <QueryClientProvider client={client}>
        <RepositoriesProvider value={repos}>
          <MemoryRouter>
            <SearchPalette />
          </MemoryRouter>
        </RepositoriesProvider>
      </QueryClientProvider>
    ),
  };
}

function openPalette() {
  fireEvent.keyDown(window, { key: "k", metaKey: true });
}

describe("SearchPalette", () => {
  it("does not fetch aziende until the palette is opened", () => {
    const repos = createInMemoryRepositories();
    (repos.auth as InMemoryAuthService).setSimulatedUser(
      makeActor(["aziende.read"])
    );
    const aziendeSpy = vi.spyOn(repos.aziende, "list");
    const attivitaSpy = vi.spyOn(repos.attivita, "list");

    mountPalette({ repos });

    expect(aziendeSpy).not.toHaveBeenCalled();
    expect(attivitaSpy).not.toHaveBeenCalled();
    expect(screen.queryByPlaceholderText(/Cerca un'azienda/i)).toBeNull();
  });

  it("fetches aziende and attivita once after ⌘K opens the palette", async () => {
    const repos = createInMemoryRepositories();
    (repos.auth as InMemoryAuthService).setSimulatedUser(
      makeActor(["aziende.read", "activities.read.all"])
    );
    const actor = makeActor(["aziende.read", "activities.read.all"]);
    await repos.aziende.create({ nome: "Allevamento Rossi" }, actor);
    const aziendeSpy = vi.spyOn(repos.aziende, "list");
    const attivitaSpy = vi.spyOn(repos.attivita, "list");

    mountPalette({ repos });
    openPalette();

    await waitFor(() => {
      expect(aziendeSpy).toHaveBeenCalledTimes(1);
    });
    expect(attivitaSpy).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByPlaceholderText(/Cerca un'azienda/i)
    ).toBeInTheDocument();
    expect(await screen.findByText(/Allevamento Rossi/)).toBeInTheDocument();
  });

  it("filters aziende by typed query", async () => {
    const repos = createInMemoryRepositories();
    (repos.auth as InMemoryAuthService).setSimulatedUser(
      makeActor(["aziende.read"])
    );
    const actor = makeActor(["aziende.read"]);
    await repos.aziende.create({ nome: "Allevamento Bianchi" }, actor);
    await repos.aziende.create({ nome: "Stalla Verdi" }, actor);

    mountPalette({ repos });
    openPalette();

    await screen.findByText(/Allevamento Bianchi/);

    fireEvent.change(screen.getByPlaceholderText(/Cerca un'azienda/i), {
      target: { value: "verdi" },
    });

    await waitFor(() => {
      expect(screen.queryByText(/Allevamento Bianchi/)).toBeNull();
    });
    expect(screen.getByText(/Stalla Verdi/)).toBeInTheDocument();
  });

  it("skips the aziende query when the user lacks the capability", async () => {
    const repos = createInMemoryRepositories();
    (repos.auth as InMemoryAuthService).setSimulatedUser(makeActor([]));
    const aziendeSpy = vi.spyOn(repos.aziende, "list");
    const attivitaSpy = vi.spyOn(repos.attivita, "list");

    mountPalette({ repos });
    openPalette();

    await screen.findByPlaceholderText(/Cerca un'azienda/i);
    expect(aziendeSpy).not.toHaveBeenCalled();
    expect(attivitaSpy).not.toHaveBeenCalled();
    expect(screen.getByText(/Nessun risultato/)).toBeInTheDocument();
  });

  it("exposes a labelled dialog with a combobox input wired to the results", async () => {
    const repos = createInMemoryRepositories();
    (repos.auth as InMemoryAuthService).setSimulatedUser(
      makeActor(["aziende.read"])
    );
    const actor = makeActor(["aziende.read"]);
    await repos.aziende.create({ nome: "Allevamento Rossi" }, actor);

    mountPalette({ repos });
    openPalette();

    const dialog = await screen.findByRole("dialog", { name: /Cerca/i });
    expect(dialog).toBeInTheDocument();

    const combobox = screen.getByRole("combobox", { name: /Cerca/i });
    expect(combobox).toHaveAttribute("aria-controls", "search-palette-results");
    expect(combobox).toHaveAttribute("aria-autocomplete", "list");

    await screen.findByText(/Allevamento Rossi/);
    const listbox = screen.getByRole("listbox");
    expect(listbox).toHaveAttribute("id", "search-palette-results");
    const options = screen.getAllByRole("option");
    expect(options.length).toBeGreaterThan(0);
    expect(options[0]).toHaveAttribute("aria-selected", "false");
  });

  it("closes on Escape and clears the query so a reopen starts empty", async () => {
    const repos = createInMemoryRepositories();
    (repos.auth as InMemoryAuthService).setSimulatedUser(
      makeActor(["aziende.read"])
    );
    const actor = makeActor(["aziende.read"]);
    await repos.aziende.create({ nome: "Allevamento Bianchi" }, actor);
    await repos.aziende.create({ nome: "Stalla Verdi" }, actor);

    mountPalette({ repos });
    openPalette();

    await screen.findByText(/Allevamento Bianchi/);
    const input = screen.getByPlaceholderText(/Cerca un'azienda/i);
    fireEvent.change(input, { target: { value: "verdi" } });
    await waitFor(() => {
      expect(screen.queryByText(/Allevamento Bianchi/)).toBeNull();
    });

    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/Cerca un'azienda/i)).toBeNull();
    });

    openPalette();
    const reopened = await screen.findByPlaceholderText(/Cerca un'azienda/i);
    expect(reopened).toHaveValue("");
    expect(await screen.findByText(/Allevamento Bianchi/)).toBeInTheDocument();
  });

  it("renders an empty-results region with the stable id when the query matches nothing", async () => {
    const repos = createInMemoryRepositories();
    (repos.auth as InMemoryAuthService).setSimulatedUser(
      makeActor(["aziende.read"])
    );
    const actor = makeActor(["aziende.read"]);
    await repos.aziende.create({ nome: "Allevamento Rossi" }, actor);

    mountPalette({ repos });
    openPalette();

    await screen.findByText(/Allevamento Rossi/);
    fireEvent.change(screen.getByPlaceholderText(/Cerca un'azienda/i), {
      target: { value: "zzz-nessuna-corrispondenza" },
    });

    await waitFor(() => {
      expect(screen.queryByText(/Allevamento Rossi/)).toBeNull();
    });
    expect(await screen.findByText("Nessun risultato.")).toBeInTheDocument();
    const combobox = screen.getByRole("combobox");
    const controlled = document.getElementById(
      combobox.getAttribute("aria-controls") ?? ""
    );
    expect(controlled).not.toBeNull();
    expect(controlled).toHaveTextContent(/Nessun risultato/i);
  });

  it("does not refetch when reopened while the cache is fresh", async () => {
    const repos = createInMemoryRepositories();
    (repos.auth as InMemoryAuthService).setSimulatedUser(
      makeActor(["aziende.read"])
    );
    const actor = makeActor(["aziende.read"]);
    await repos.aziende.create({ nome: "Cache Test Farm" }, actor);
    const aziendeSpy = vi.spyOn(repos.aziende, "list");

    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: 60_000, gcTime: 60_000 },
      },
    });

    mountPalette({ repos, client });

    openPalette();
    await waitFor(() => {
      expect(aziendeSpy).toHaveBeenCalledTimes(1);
    });
    await screen.findByText(/Cache Test Farm/);

    fireEvent.keyDown(window, { key: "k", metaKey: true });
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/Cerca un'azienda/i)).toBeNull();
    });

    fireEvent.keyDown(window, { key: "k", metaKey: true });
    await screen.findByText(/Cache Test Farm/);
    expect(aziendeSpy).toHaveBeenCalledTimes(1);
  });
});
