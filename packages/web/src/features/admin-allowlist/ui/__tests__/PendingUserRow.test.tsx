import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { User } from "@vet/shared";
import { PendingUserRow } from "../PendingUserRow";

const ROLE_OPTIONS = [
  { value: "vet", label: "Veterinario" },
  { value: "admin", label: "Amministratore" },
];

function makeUser(overrides: Partial<User> = {}): User {
  return {
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
}

function renderRow(overrides: Partial<Parameters<typeof PendingUserRow>[0]> = {}) {
  const onRoleChange = vi.fn();
  const onApprove = vi.fn();
  const onReject = vi.fn();
  render(
    <PendingUserRow
      user={makeUser()}
      roleOptions={ROLE_OPTIONS}
      roleValue="vet"
      busy={false}
      onRoleChange={onRoleChange}
      onApprove={onApprove}
      onReject={onReject}
      {...overrides}
    />
  );
  return { onRoleChange, onApprove, onReject };
}

describe("PendingUserRow", () => {
  it("renders the email, display name and pending badge", () => {
    renderRow();
    expect(screen.getByText("pending@vet.it")).toBeInTheDocument();
    expect(screen.getByText(/Mario Pendente/)).toBeInTheDocument();
    expect(screen.getByText("In attesa")).toBeInTheDocument();
  });

  it("spans the full grid width to avoid the squeezed-column overlap", () => {
    const { container } = render(
      <PendingUserRow
        user={makeUser()}
        roleOptions={ROLE_OPTIONS}
        roleValue="vet"
        busy={false}
        onRoleChange={vi.fn()}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain("sm:col-span-2");
    expect(root.className).toContain("lg:col-span-3");
  });

  it("emits the selected role without mutating other fields", () => {
    const { onRoleChange } = renderRow();
    fireEvent.change(screen.getByLabelText(/Ruolo/i), {
      target: { value: "admin" },
    });
    expect(onRoleChange).toHaveBeenCalledWith("admin");
  });

  it("invokes approve and reject with the user", () => {
    const { onApprove, onReject } = renderRow();
    screen.getByRole("button", { name: /Approva pending@vet\.it/i }).click();
    screen.getByRole("button", { name: /Rifiuta pending@vet\.it/i }).click();
    expect(onApprove).toHaveBeenCalledOnce();
    expect(onReject).toHaveBeenCalledOnce();
  });

  it("disables the select and the actions while busy", () => {
    renderRow({ busy: true });
    expect(screen.getByLabelText(/Ruolo/i)).toBeDisabled();
    for (const btn of screen.getAllByRole("button")) {
      expect(btn).toBeDisabled();
    }
  });
});
