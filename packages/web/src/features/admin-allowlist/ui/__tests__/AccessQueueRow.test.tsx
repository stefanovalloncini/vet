import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AccessRequest, User } from "@vet/shared";
import { AccessQueueRow } from "../AccessQueueRow";
import type { AccessQueueRow as QueueRow } from "../../lib/mergeAccessQueue";

const ROLE_OPTIONS = [
  { value: "vet", label: "Veterinario" },
  { value: "admin", label: "Amministratore" },
];

function pendingRow(overrides: Partial<User> = {}): QueueRow {
  const user: User = {
    uid: "u1",
    email: "pending@vet.it",
    displayName: "Mario Pendente",
    roleId: "vet",
    approved: false,
    disabled: false,
    createdAt: new Date("2026-01-10T09:00:00Z"),
    updatedAt: new Date("2026-01-10T09:00:00Z"),
    schemaVersion: 1,
    ...overrides,
  };
  return {
    kind: "pending",
    emailNorm: user.email,
    email: user.email,
    date: user.createdAt,
    user,
  };
}

function requestRow(overrides: Partial<AccessRequest> = {}): QueueRow {
  const request: AccessRequest = {
    emailNorm: "asker@vet.it",
    email: "asker@vet.it",
    firstAttemptAt: new Date("2026-01-01T10:00:00Z"),
    lastAttemptAt: new Date("2026-01-02T10:00:00Z"),
    attempts: 2,
    schemaVersion: 1,
    ...overrides,
  };
  return {
    kind: "request",
    emailNorm: request.emailNorm,
    email: request.email,
    date: request.firstAttemptAt,
    request,
  };
}

function renderRow(
  row: QueueRow,
  overrides: Partial<Parameters<typeof AccessQueueRow>[0]> = {}
) {
  const onRoleChange = vi.fn();
  const onAccept = vi.fn();
  const onReject = vi.fn();
  render(
    <AccessQueueRow
      row={row}
      roleOptions={ROLE_OPTIONS}
      roleValue={row.kind === "pending" ? "vet" : ""}
      busy={false}
      onRoleChange={onRoleChange}
      onAccept={onAccept}
      onReject={onReject}
      {...overrides}
    />
  );
  return { onRoleChange, onAccept, onReject };
}

describe("AccessQueueRow", () => {
  it("shows the da-confermare chip and a role select for a pending users-doc", () => {
    renderRow(pendingRow());
    expect(screen.getByText("pending@vet.it")).toBeInTheDocument();
    expect(screen.getByText("In allowlist, da confermare")).toBeInTheDocument();
    expect(screen.getByLabelText(/Ruolo/i)).toBeInTheDocument();
  });

  it("shows the non-in-allowlist chip and no role select for a request", () => {
    renderRow(requestRow());
    expect(screen.getByText("Non in allowlist")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Ruolo/i)).toBeNull();
    expect(screen.getByText(/2 tentativi/i)).toBeInTheDocument();
  });

  it("labels the primary action Approva for pending and Aggiungi for request", () => {
    const { rerender } = render(
      <AccessQueueRow
        row={pendingRow()}
        roleOptions={ROLE_OPTIONS}
        roleValue="vet"
        busy={false}
        onRoleChange={vi.fn()}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />
    );
    expect(
      screen.getByRole("button", { name: /Approva pending@vet\.it/i })
    ).toBeInTheDocument();

    rerender(
      <AccessQueueRow
        row={requestRow()}
        roleOptions={ROLE_OPTIONS}
        roleValue=""
        busy={false}
        onRoleChange={vi.fn()}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />
    );
    expect(
      screen.getByRole("button", { name: /Aggiungi asker@vet\.it/i })
    ).toBeInTheDocument();
  });

  it("emits the full row on accept and reject", () => {
    const row = pendingRow();
    const { onAccept, onReject } = renderRow(row);
    screen.getByRole("button", { name: /Approva pending@vet\.it/i }).click();
    screen.getByRole("button", { name: /Rifiuta pending@vet\.it/i }).click();
    expect(onAccept).toHaveBeenCalledWith(row);
    expect(onReject).toHaveBeenCalledWith(row);
  });

  it("emits the selected role for a pending row", () => {
    const { onRoleChange } = renderRow(pendingRow());
    fireEvent.change(screen.getByLabelText(/Ruolo/i), {
      target: { value: "admin" },
    });
    expect(onRoleChange).toHaveBeenCalledWith("admin");
  });

  it("disables every control while busy", () => {
    renderRow(pendingRow(), { busy: true });
    expect(screen.getByLabelText(/Ruolo/i)).toBeDisabled();
    for (const btn of screen.getAllByRole("button")) {
      expect(btn).toBeDisabled();
    }
  });

  it("spans the full grid width to avoid squeezed-column overlap", () => {
    const { container } = render(
      <AccessQueueRow
        row={requestRow()}
        roleOptions={ROLE_OPTIONS}
        roleValue=""
        busy={false}
        onRoleChange={vi.fn()}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain("sm:col-span-2");
    expect(root.className).toContain("lg:col-span-3");
  });
});
