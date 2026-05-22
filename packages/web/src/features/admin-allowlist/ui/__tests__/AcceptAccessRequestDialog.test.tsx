import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AccessRequest, Repositories } from "@vet/shared";
import { RepositoriesProvider } from "../../../../infrastructure/RepositoriesContext";
import { AcceptAccessRequestDialog } from "../AcceptAccessRequestDialog";

const callable = vi.fn();

vi.mock("firebase/functions", () => ({
  getFunctions: vi.fn(() => ({})),
  httpsCallable: vi.fn(() => callable),
}));

const ROLES = [
  { id: "vet", name: "Veterinario" },
  { id: "admin", name: "Amministratore" },
];

const REQUEST: AccessRequest = {
  emailNorm: "asker@vet.it",
  email: "asker@vet.it",
  firstAttemptAt: new Date("2026-01-01T10:00:00Z"),
  lastAttemptAt: new Date("2026-01-02T10:00:00Z"),
  attempts: 2,
  schemaVersion: 1,
};

interface Harness {
  onClose: ReturnType<typeof vi.fn>;
  onAccepted: ReturnType<typeof vi.fn>;
}

function renderDialog(
  overrides: Partial<{
    open: boolean;
    request: AccessRequest | null;
  }> = {}
): Harness {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const repos = {} as Repositories;
  const onClose = vi.fn();
  const onAccepted = vi.fn();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <RepositoriesProvider value={repos}>{children}</RepositoriesProvider>
    </QueryClientProvider>
  );
  render(
    <AcceptAccessRequestDialog
      open={overrides.open ?? true}
      request={overrides.request === undefined ? REQUEST : overrides.request}
      roles={ROLES}
      onClose={onClose}
      onAccepted={onAccepted}
    />,
    { wrapper }
  );
  return { onClose, onAccepted };
}

describe("AcceptAccessRequestDialog", () => {
  beforeEach(() => {
    callable.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the requested email", () => {
    renderDialog();
    expect(screen.getByText(REQUEST.email)).toBeInTheDocument();
  });

  it("submits the selected role and closes on success", async () => {
    callable.mockResolvedValueOnce({ data: undefined });
    const { onClose, onAccepted } = renderDialog();
    fireEvent.change(screen.getByLabelText(/Ruolo iniziale/i), {
      target: { value: "admin" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Aggiungi/i }));
    await waitFor(() => expect(onAccepted).toHaveBeenCalledOnce());
    expect(onClose).toHaveBeenCalledOnce();
    expect(callable).toHaveBeenCalledWith({
      email: REQUEST.email,
      roleId: "admin",
    });
  });

  it("defaults the role to vet on submit", async () => {
    callable.mockResolvedValueOnce({ data: undefined });
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: /Aggiungi/i }));
    await waitFor(() => expect(callable).toHaveBeenCalledOnce());
    expect(callable).toHaveBeenCalledWith({
      email: REQUEST.email,
      roleId: "vet",
    });
  });

  it("shows an error and keeps the dialog open when the mutation rejects", async () => {
    callable.mockRejectedValueOnce(new Error("nope"));
    const { onClose, onAccepted } = renderDialog();
    fireEvent.click(screen.getByRole("button", { name: /Aggiungi/i }));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/non riuscita/i);
    });
    expect(onAccepted).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onClose when Annulla is clicked", () => {
    const { onClose } = renderDialog();
    fireEvent.click(screen.getByRole("button", { name: /Annulla/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does nothing when submitted without a request", () => {
    renderDialog({ request: null });
    fireEvent.click(screen.getByRole("button", { name: /Aggiungi/i }));
    expect(callable).not.toHaveBeenCalled();
  });
});
