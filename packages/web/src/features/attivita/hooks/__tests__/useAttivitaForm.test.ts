import type { ReactNode, FormEvent } from "react";
import { createElement } from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, beforeEach } from "vitest";
import type {
  ActivityType,
  ActorContext,
  Azienda,
  Repositories,
} from "@vet/shared";
import { useAttivitaForm } from "../useAttivitaForm";
import { RepositoriesProvider } from "../../../../infrastructure/RepositoriesContext";
import { createInMemoryRepositories } from "../../../../infrastructure/composition/in-memory";

const actor: ActorContext = {
  uid: "u1",
  email: "vet@example.com",
  displayName: "Vet One",
  roleId: "vet",
  caps: new Set(["activities.create"]),
  approved: true,
};

const azienda: Azienda = {
  id: "az1",
  nome: "Cascina",
  nomeNorm: "cascina",
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: actor.uid,
  updatedBy: actor.uid,
  createdByName: actor.displayName,
  updatedByName: actor.displayName,
  isDeleted: false,
  schemaVersion: 1,
};

const tipo: ActivityType = {
  id: "tp1",
  nome: "Visita",
  ordine: 1,
  attivo: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  schemaVersion: 1,
};

function fakeEvent(): FormEvent {
  return { preventDefault: () => undefined } as unknown as FormEvent;
}

function makeWrapper(repos: Repositories, initialEntries: string[]) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    const routes = createElement(Routes, null, [
      createElement(Route, {
        key: "edit",
        path: "/attivita/:id",
        element: children,
      }),
      createElement(Route, {
        key: "new",
        path: "/attivita/nuova",
        element: children,
      }),
    ]);
    const router = createElement(MemoryRouter, {
      initialEntries,
      children: routes,
    });
    const repoTree = createElement(RepositoriesProvider, {
      value: repos,
      children: router,
    });
    return createElement(QueryClientProvider, {
      client,
      children: repoTree,
    });
  };
}

function renderForm(
  repos: Repositories,
  opts: { id?: string; path: string }
) {
  const wrapper = makeWrapper(repos, [opts.path]);
  return renderHook(
    () =>
      useAttivitaForm({
        id: opts.id,
        user: actor,
        aziende: [azienda],
        tipi: [tipo],
      }),
    { wrapper }
  );
}

describe("useAttivitaForm", () => {
  let repos: Repositories;

  beforeEach(() => {
    repos = createInMemoryRepositories();
  });

  it("starts in create mode with empty form and no initialLoading", () => {
    const { result } = renderForm(repos, { path: "/attivita/nuova" });
    expect(result.current.isEdit).toBe(false);
    expect(result.current.initialLoading).toBe(false);
    expect(result.current.form.aziendaId).toBe("");
    expect(result.current.form.note).toBe("");
  });

  it("update sets a field and clears its prior error", async () => {
    const { result } = renderForm(repos, { path: "/attivita/nuova" });
    await act(async () => {
      await result.current.submit(fakeEvent());
    });
    expect(result.current.errors.aziendaId).toBeDefined();
    act(() => {
      result.current.update("aziendaId", azienda.id);
    });
    expect(result.current.form.aziendaId).toBe(azienda.id);
    expect(result.current.errors.aziendaId).toBeUndefined();
  });

  it("submit creates an attivita when fields are valid", async () => {
    const { result } = renderForm(repos, { path: "/attivita/nuova" });
    act(() => {
      result.current.update("aziendaId", azienda.id);
      result.current.update("tipoId", tipo.id);
      result.current.update("tariffa", "50");
    });
    await act(async () => {
      await result.current.submit(fakeEvent());
    });
    const list = await repos.attivita.list();
    expect(list).toHaveLength(1);
    expect(list[0]?.aziendaId).toBe(azienda.id);
    expect(list[0]?.tipoId).toBe(tipo.id);
    expect(list[0]?.tariffa).toBe(50);
    expect(result.current.busy).toBe(false);
    expect(result.current.globalError).toBeNull();
  });

  it("submit reports validation errors and does not write", async () => {
    const { result } = renderForm(repos, { path: "/attivita/nuova" });
    await act(async () => {
      await result.current.submit(fakeEvent());
    });
    expect(result.current.errors.aziendaId).toBeDefined();
    expect(await repos.attivita.list()).toHaveLength(0);
  });

  it("loads existing attivita in edit mode and exposes loaded owner", async () => {
    const created = await repos.attivita.create(
      {
        data: new Date("2026-04-01"),
        aziendaId: azienda.id,
        tipoId: tipo.id,
        oraria: false,
        tariffa: 75,
      },
      { aziendaNome: azienda.nome, tipoNome: tipo.nome },
      actor
    );
    const { result } = renderForm(repos, {
      id: created,
      path: `/attivita/${created}`,
    });
    await waitFor(() => {
      expect(result.current.initialLoading).toBe(false);
    });
    expect(result.current.isEdit).toBe(true);
    expect(result.current.form.aziendaId).toBe(azienda.id);
    expect(result.current.form.tariffa).toBe("75");
    expect(result.current.loaded?.ownerUid).toBe(actor.uid);
  });

  it("remove soft-deletes the attivita when editing", async () => {
    const created = await repos.attivita.create(
      {
        data: new Date("2026-04-01"),
        aziendaId: azienda.id,
        tipoId: tipo.id,
        oraria: false,
        tariffa: 75,
      },
      { aziendaNome: azienda.nome, tipoNome: tipo.nome },
      actor
    );
    const { result } = renderForm(repos, {
      id: created,
      path: `/attivita/${created}`,
    });
    await waitFor(() => {
      expect(result.current.initialLoading).toBe(false);
    });
    await act(async () => {
      await result.current.remove();
    });
    expect(await repos.attivita.list()).toHaveLength(0);
  });
});
