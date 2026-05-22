import { act, renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { InMemoryAziendeRepository } from "@vet/shared/testing";
import type { ActorContext, Repositories } from "@vet/shared";
import { RepositoriesProvider } from "../../../../infrastructure/RepositoriesContext";
import { ToastProvider } from "../../../../shared/ui/Toast";
import { useAziendaForm } from "../useAziendaForm";

const actor: ActorContext = {
  uid: "u1",
  email: "tester@example.com",
  displayName: "Tester",
  roleId: "vet",
  caps: new Set(["aziende.create", "aziende.update"]),
  approved: true,
};

function makeRepos(aziende: InMemoryAziendeRepository): Repositories {
  return { aziende } as unknown as Repositories;
}

function buildWrapper(repos: Repositories) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <RepositoriesProvider value={repos}>
          <ToastProvider>
            <MemoryRouter>{children}</MemoryRouter>
          </ToastProvider>
        </RepositoriesProvider>
      </QueryClientProvider>
    );
  };
}

describe("useAziendaForm", () => {
  it("starts in create mode with an empty form and not loading", () => {
    const repo = new InMemoryAziendeRepository();
    const { result } = renderHook(
      () => useAziendaForm({ id: undefined, user: actor, repo }),
      { wrapper: buildWrapper(makeRepos(repo)) }
    );
    expect(result.current.isEdit).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.form.nome).toBe("");
    expect(result.current.loaded).toBeNull();
  });

  it("loads existing azienda values into the form in edit mode", async () => {
    const repo = new InMemoryAziendeRepository();
    const id = await repo.create(
      { nome: "Cascina Test", indirizzo: "Via Roma 1" },
      actor
    );
    const { result } = renderHook(
      () => useAziendaForm({ id, user: actor, repo }),
      { wrapper: buildWrapper(makeRepos(repo)) }
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => expect(result.current.form.nome).toBe("Cascina Test"));
    expect(result.current.isEdit).toBe(true);
    expect(result.current.form.indirizzo).toBe("Via Roma 1");
    expect(result.current.loaded?.id).toBe(id);
  });

  it("update writes the field and clears its prior error", () => {
    const repo = new InMemoryAziendeRepository();
    const { result } = renderHook(
      () => useAziendaForm({ id: undefined, user: actor, repo }),
      { wrapper: buildWrapper(makeRepos(repo)) }
    );
    act(() => {
      result.current.update("nome", "Nuova Cascina");
    });
    expect(result.current.form.nome).toBe("Nuova Cascina");
    expect(result.current.errors.nome).toBeUndefined();
  });
});
