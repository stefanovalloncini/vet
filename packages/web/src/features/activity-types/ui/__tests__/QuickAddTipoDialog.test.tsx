import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { InMemoryActivityTypesRepository } from "@vet/shared/testing";
import type { Repositories } from "@vet/shared";
import { RepositoriesProvider } from "../../../../infrastructure/RepositoriesContext";
import { QuickAddTipoDialog } from "../QuickAddTipoDialog";

function buildWrapper(repo: InMemoryActivityTypesRepository) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const repos = { activityTypes: repo } as unknown as Repositories;
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <RepositoriesProvider value={repos}>{children}</RepositoriesProvider>
      </QueryClientProvider>
    );
  };
}

describe("QuickAddTipoDialog", () => {
  it("creates a tipo with valid name and notifies the caller", async () => {
    const repo = new InMemoryActivityTypesRepository();
    const Wrapper = buildWrapper(repo);
    const onCreated = vi.fn();
    const onClose = vi.fn();
    render(
      <Wrapper>
        <QuickAddTipoDialog
          open
          onClose={onClose}
          onCreated={onCreated}
          nextOrdine={90}
        />
      </Wrapper>
    );

    fireEvent.change(screen.getByLabelText(/Nome/i), {
      target: { value: "Cesareo" },
    });
    fireEvent.change(screen.getByLabelText(/Tariffa standard/i), {
      target: { value: "120" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Crea/i }));

    await waitFor(() => expect(onCreated).toHaveBeenCalled());
    expect(onClose).toHaveBeenCalled();
    const created = onCreated.mock.calls[0]?.[0];
    expect(created.id).toBe("cesareo");
    expect(created.nome).toBe("Cesareo");
    expect(created.tariffaStandard).toBe(120);
    expect(created.ordine).toBe(90);
    expect(created.attivo).toBe(true);
  });

  it("disables Crea while the name is empty or whitespace", () => {
    const repo = new InMemoryActivityTypesRepository();
    const Wrapper = buildWrapper(repo);
    const onCreated = vi.fn();
    render(
      <Wrapper>
        <QuickAddTipoDialog
          open
          onClose={vi.fn()}
          onCreated={onCreated}
          nextOrdine={10}
        />
      </Wrapper>
    );
    const crea = screen.getByRole("button", { name: /Crea/i });
    expect(crea).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Nome/i), {
      target: { value: "   " },
    });
    expect(crea).toBeDisabled();
    expect(onCreated).not.toHaveBeenCalled();
  });

  it("rejects an invalid tariffa with a field-level error", async () => {
    const repo = new InMemoryActivityTypesRepository();
    const Wrapper = buildWrapper(repo);
    render(
      <Wrapper>
        <QuickAddTipoDialog
          open
          onClose={vi.fn()}
          onCreated={vi.fn()}
          nextOrdine={10}
        />
      </Wrapper>
    );
    fireEvent.change(screen.getByLabelText(/Nome/i), {
      target: { value: "Cesareo" },
    });
    fireEvent.change(screen.getByLabelText(/Tariffa standard/i), {
      target: { value: "-5" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Crea/i }));
    expect(
      await screen.findByText(/Tariffa non valida/i)
    ).toBeInTheDocument();
  });

  it("creates without tariffa when the tariffa field is blank", async () => {
    const repo = new InMemoryActivityTypesRepository();
    const Wrapper = buildWrapper(repo);
    const onCreated = vi.fn();
    render(
      <Wrapper>
        <QuickAddTipoDialog
          open
          onClose={vi.fn()}
          onCreated={onCreated}
          nextOrdine={10}
        />
      </Wrapper>
    );
    fireEvent.change(screen.getByLabelText(/Nome/i), {
      target: { value: "Profilassi" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Crea/i }));
    await waitFor(() => expect(onCreated).toHaveBeenCalled());
    const created = onCreated.mock.calls[0]?.[0];
    expect(created.tariffaStandard).toBeUndefined();
  });

  it("does not render when closed", () => {
    const repo = new InMemoryActivityTypesRepository();
    const Wrapper = buildWrapper(repo);
    render(
      <Wrapper>
        <QuickAddTipoDialog
          open={false}
          onClose={vi.fn()}
          onCreated={vi.fn()}
          nextOrdine={10}
        />
      </Wrapper>
    );
    expect(screen.queryByLabelText(/Nome/i)).toBeNull();
  });
});
