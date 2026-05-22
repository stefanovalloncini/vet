import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ActorContext, Azienda, Repositories } from "@vet/shared";
import {
  InMemoryAuthService,
  InMemoryAziendeRepository,
} from "@vet/shared/testing";
import { RepositoriesProvider } from "../../../../infrastructure/RepositoriesContext";
import { QuickAddAziendaDialog } from "../QuickAddAziendaDialog";

function actor(): ActorContext {
  return {
    uid: "vet-1",
    email: "vet@example.com",
    displayName: "Vet One",
    roleId: "vet",
    caps: new Set(),
    approved: true,
  };
}

function buildRepos(): { repos: Repositories; auth: InMemoryAuthService } {
  const auth = new InMemoryAuthService();
  auth.setSimulatedUser(actor());
  const aziende = new InMemoryAziendeRepository();
  return {
    repos: { aziende, auth } as unknown as Repositories,
    auth,
  };
}

function makeWrapper(repos: Repositories) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <RepositoriesProvider value={repos}>{children}</RepositoriesProvider>
      </QueryClientProvider>
    );
  };
}

describe("QuickAddAziendaDialog", () => {
  it("renders nothing when open is false", () => {
    const { repos } = buildRepos();
    render(
      <QuickAddAziendaDialog
        open={false}
        onClose={() => {}}
        onCreated={() => {}}
      />,
      { wrapper: makeWrapper(repos) }
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("creates an azienda and calls onCreated then onClose", async () => {
    const { repos } = buildRepos();
    const onCreated = vi.fn<(a: Azienda) => void>();
    const onClose = vi.fn();
    render(
      <QuickAddAziendaDialog
        open={true}
        onClose={onClose}
        onCreated={onCreated}
      />,
      { wrapper: makeWrapper(repos) }
    );
    fireEvent.change(screen.getByLabelText(/Nome/i), {
      target: { value: "Cascina San Marco" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Crea/i }));
    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledTimes(1);
    });
    expect(onClose).toHaveBeenCalled();
    const created = onCreated.mock.calls[0]?.[0];
    expect(created?.nome).toBe("Cascina San Marco");
  });

  it("does not save when nome is empty whitespace", async () => {
    const { repos } = buildRepos();
    const onCreated = vi.fn();
    render(
      <QuickAddAziendaDialog
        open={true}
        onClose={() => {}}
        onCreated={onCreated}
      />,
      { wrapper: makeWrapper(repos) }
    );
    fireEvent.change(screen.getByLabelText(/Nome/i), {
      target: { value: " " },
    });
    fireEvent.click(screen.getByRole("button", { name: /Crea/i }));
    await new Promise((r) => setTimeout(r, 30));
    expect(onCreated).not.toHaveBeenCalled();
  });

  it("Annulla closes the dialog without saving", () => {
    const { repos } = buildRepos();
    const onClose = vi.fn();
    const onCreated = vi.fn();
    render(
      <QuickAddAziendaDialog
        open={true}
        onClose={onClose}
        onCreated={onCreated}
      />,
      { wrapper: makeWrapper(repos) }
    );
    fireEvent.click(screen.getByRole("button", { name: /Annulla/i }));
    expect(onClose).toHaveBeenCalled();
    expect(onCreated).not.toHaveBeenCalled();
  });

  it("disables the submit button when nome is empty", () => {
    const { repos } = buildRepos();
    render(
      <QuickAddAziendaDialog
        open={true}
        onClose={() => {}}
        onCreated={() => {}}
      />,
      { wrapper: makeWrapper(repos) }
    );
    expect(screen.getByRole("button", { name: /Crea/i })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Nome/i), {
      target: { value: "Allevamento Rossi" },
    });
    expect(screen.getByRole("button", { name: /Crea/i })).not.toBeDisabled();
  });
});
