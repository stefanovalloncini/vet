import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  InMemoryAllowlistRepository,
  InMemoryRoleRepository,
} from "@vet/shared/testing";
import type { ActorContext, Repositories } from "@vet/shared";
import { RepositoriesProvider } from "../../../../infrastructure/RepositoriesContext";
import { AddAllowlistEntryForm } from "../AddAllowlistEntryForm";

const ROLES = [
  { id: "vet", name: "Veterinario" },
  { id: "admin", name: "Amministratore" },
];

const ADMIN: ActorContext = {
  uid: "admin-uid",
  email: "admin@vet.it",
  displayName: "Admin",
  roleId: "admin",
  caps: new Set(),
  approved: true,
};

interface Harness {
  allowlist: InMemoryAllowlistRepository;
  onAdded: ReturnType<typeof vi.fn>;
  onCancel: ReturnType<typeof vi.fn>;
}

function renderForm(): Harness {
  const allowlist = new InMemoryAllowlistRepository();
  const rolesRepo = new InMemoryRoleRepository();
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const repos = { allowlist, roles: rolesRepo } as unknown as Repositories;
  const onAdded = vi.fn();
  const onCancel = vi.fn();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <RepositoriesProvider value={repos}>{children}</RepositoriesProvider>
    </QueryClientProvider>
  );
  render(
    <AddAllowlistEntryForm
      roles={ROLES}
      user={ADMIN}
      onAdded={onAdded}
      onCancel={onCancel}
    />,
    { wrapper }
  );
  return { allowlist, onAdded, onCancel };
}

describe("AddAllowlistEntryForm", () => {
  it("rejects empty email with a field-level error and does not call the mutation", async () => {
    const { allowlist, onAdded } = renderForm();
    fireEvent.click(screen.getByRole("button", { name: /Aggiungi email/i }));
    await screen.findByRole("alert");
    expect(onAdded).not.toHaveBeenCalled();
    expect(await allowlist.list()).toHaveLength(0);
  });

  it("rejects invalid email with a field-level error", async () => {
    const { allowlist, onAdded } = renderForm();
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "not-an-email" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Aggiungi email/i }));
    await screen.findByRole("alert");
    expect(onAdded).not.toHaveBeenCalled();
    expect(await allowlist.list()).toHaveLength(0);
  });

  it("submits a valid entry and calls onAdded", async () => {
    const { allowlist, onAdded } = renderForm();
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "new@vet.it" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Aggiungi email/i }));
    await waitFor(() => expect(onAdded).toHaveBeenCalledOnce());
    const entries = await allowlist.list();
    expect(entries).toHaveLength(1);
    expect(entries[0]?.email).toBe("new@vet.it");
    expect(entries[0]?.defaultRoleId).toBe("vet");
  });

  it("forwards the selected role to the mutation input", async () => {
    const { allowlist, onAdded } = renderForm();
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "boss@vet.it" },
    });
    fireEvent.change(screen.getByLabelText(/Ruolo iniziale/i), {
      target: { value: "admin" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Aggiungi email/i }));
    await waitFor(() => expect(onAdded).toHaveBeenCalledOnce());
    const entries = await allowlist.list();
    expect(entries[0]?.defaultRoleId).toBe("admin");
  });

  it("includes notes only when non-empty", async () => {
    const { allowlist, onAdded } = renderForm();
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "with-notes@vet.it" },
    });
    fireEvent.change(screen.getByLabelText(/Note/i), {
      target: { value: "  important   " },
    });
    fireEvent.click(screen.getByRole("button", { name: /Aggiungi email/i }));
    await waitFor(() => expect(onAdded).toHaveBeenCalledOnce());
    const entries = await allowlist.list();
    expect(entries[0]?.notes).toBe("important");
  });

  it("omits notes when blank or whitespace-only", async () => {
    const { allowlist, onAdded } = renderForm();
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "blank-notes@vet.it" },
    });
    fireEvent.change(screen.getByLabelText(/Note/i), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByRole("button", { name: /Aggiungi email/i }));
    await waitFor(() => expect(onAdded).toHaveBeenCalledOnce());
    const entries = await allowlist.list();
    expect(entries[0]?.notes).toBeUndefined();
  });

  it("calls onCancel when Annulla is clicked", () => {
    const { onCancel } = renderForm();
    fireEvent.click(screen.getByRole("button", { name: /Annulla/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("shows a generic error when the mutation rejects", async () => {
    const { allowlist, onAdded } = renderForm();
    vi.spyOn(allowlist, "add").mockRejectedValueOnce(new Error("boom"));
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "fail@vet.it" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Aggiungi email/i }));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/non riuscita/i);
    });
    expect(onAdded).not.toHaveBeenCalled();
  });
});
