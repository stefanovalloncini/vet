import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AccessRequest, Repositories, User } from "@vet/shared";
import {
  InMemoryAccessRequestRepository,
  InMemoryUserRepository,
} from "@vet/shared/testing";
import { buildProvidersWrapper } from "../../../../__tests__/renderWithProviders";
import { AccessQueueTab } from "../AccessQueueTab";

const callable = vi.fn();
const httpsCallable = vi.fn((_functions: unknown, _name: string) => callable);

vi.mock("firebase/functions", () => ({
  getFunctions: vi.fn(() => ({})),
  httpsCallable: (functions: unknown, name: string) =>
    httpsCallable(functions, name),
}));

const ROLES = [
  { id: "vet", name: "Veterinario" },
  { id: "admin", name: "Amministratore" },
];

function pendingUser(): User {
  return {
    uid: "u1",
    email: "pending@vet.it",
    displayName: "Mario Pendente",
    roleId: "vet",
    approved: false,
    disabled: false,
    createdAt: new Date("2026-02-01T09:00:00Z"),
    updatedAt: new Date("2026-02-01T09:00:00Z"),
    schemaVersion: 1,
  };
}

function accessRequest(): AccessRequest {
  return {
    emailNorm: "asker@vet.it",
    email: "asker@vet.it",
    firstAttemptAt: new Date("2026-01-01T10:00:00Z"),
    lastAttemptAt: new Date("2026-01-02T10:00:00Z"),
    attempts: 2,
    schemaVersion: 1,
  };
}

function renderTab() {
  const users = new InMemoryUserRepository();
  users.setForTest("u1", pendingUser());
  const accessRequests = new InMemoryAccessRequestRepository();
  accessRequests.upsertForTest(accessRequest());
  const repos = { users, accessRequests } as unknown as Partial<Repositories>;
  render(<AccessQueueTab roles={ROLES} />, {
    wrapper: buildProvidersWrapper({ repos }),
  });
  return { users, accessRequests };
}

describe("AccessQueueTab action routing", () => {
  beforeEach(() => {
    callable.mockReset();
    callable.mockResolvedValue({ data: undefined });
    httpsCallable.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists both a pending users-doc and an access request", async () => {
    renderTab();
    expect(await screen.findByText("pending@vet.it")).toBeInTheDocument();
    expect(screen.getByText("asker@vet.it")).toBeInTheDocument();
  });

  it("approves a pending users-doc via users.approve, not the callable", async () => {
    const { users } = renderTab();
    const approve = vi.spyOn(users, "approve");
    fireEvent.change(await screen.findByLabelText(/Ruolo/i), {
      target: { value: "admin" },
    });
    screen.getByRole("button", { name: /Approva pending@vet\.it/i }).click();
    await waitFor(() => expect(approve).toHaveBeenCalledWith("u1", "admin"));
    expect(callable).not.toHaveBeenCalled();
  });

  it("accepts a request via the acceptAccessRequest callable", async () => {
    renderTab();
    (await screen.findByRole("button", { name: /Aggiungi asker@vet\.it/i })).click();
    fireEvent.click(
      await screen.findByRole("button", { name: /^Aggiungi$/i })
    );
    await waitFor(() =>
      expect(httpsCallable).toHaveBeenCalledWith(
        expect.anything(),
        "acceptAccessRequest"
      )
    );
    expect(callable).toHaveBeenCalledWith({
      email: "asker@vet.it",
      roleId: "vet",
    });
  });

  it("rejects a pending users-doc via users.delete, not the callable", async () => {
    const { users } = renderTab();
    const del = vi.spyOn(users, "delete");
    (await screen.findByRole("button", { name: /Rifiuta pending@vet\.it/i })).click();
    fireEvent.click(
      await screen.findByRole("button", { name: /^Rifiuta$/i })
    );
    await waitFor(() => expect(del).toHaveBeenCalledWith("u1"));
    expect(callable).not.toHaveBeenCalled();
  });

  it("rejects a request via the rejectAccessRequest callable", async () => {
    renderTab();
    (await screen.findByRole("button", { name: /Rifiuta asker@vet\.it/i })).click();
    fireEvent.click(
      await screen.findByRole("button", { name: /^Rifiuta$/i })
    );
    await waitFor(() =>
      expect(httpsCallable).toHaveBeenCalledWith(
        expect.anything(),
        "rejectAccessRequest"
      )
    );
    expect(callable).toHaveBeenCalledWith({ email: "asker@vet.it" });
  });
});
