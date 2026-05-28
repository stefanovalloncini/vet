import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AllowlistEntry } from "@vet/shared";
import { AllowlistEntryRow } from "../AllowlistEntryRow";

const ROLES = [
  { id: "vet", name: "Veterinario" },
  { id: "admin", name: "Amministratore" },
];

function makeEntry(overrides: Partial<AllowlistEntry> = {}): AllowlistEntry {
  return {
    emailNorm: "mario.rossi@vet.it",
    email: "mario.rossi@vet.it",
    defaultRoleId: "vet",
    invitedAt: new Date("2026-01-15T10:00:00Z"),
    invitedBy: "admin@vet.it",
    schemaVersion: 1,
    ...overrides,
  };
}

describe("AllowlistEntryRow", () => {
  it("renders the email and resolves the role name", () => {
    render(
      <AllowlistEntryRow
        entry={makeEntry()}
        roles={ROLES}
        canManage={false}
        busy={false}
        onRemove={vi.fn()}
      />
    );
    expect(screen.getByText("mario.rossi@vet.it")).toBeInTheDocument();
    expect(screen.getByText("Veterinario")).toBeInTheDocument();
  });

  it("falls back to the role id when the role is unknown", () => {
    render(
      <AllowlistEntryRow
        entry={makeEntry({ defaultRoleId: "ghost-role" })}
        roles={ROLES}
        canManage={false}
        busy={false}
        onRemove={vi.fn()}
      />
    );
    expect(screen.getByText("ghost-role")).toBeInTheDocument();
  });

  it("spans the full grid width so wide rows do not collide", () => {
    const { container } = render(
      <AllowlistEntryRow
        entry={makeEntry()}
        roles={ROLES}
        canManage={false}
        busy={false}
        onRemove={vi.fn()}
      />
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain("sm:col-span-2");
    expect(root.className).toContain("lg:col-span-3");
  });

  it("renders a remove control with an email-scoped label when manageable", () => {
    const onRemove = vi.fn();
    render(
      <AllowlistEntryRow
        entry={makeEntry()}
        roles={ROLES}
        canManage
        busy={false}
        onRemove={onRemove}
      />
    );
    const btn = screen.getByRole("button", {
      name: /Rimuovi mario\.rossi@vet\.it/i,
    });
    btn.click();
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it("hides the remove control when not manageable", () => {
    render(
      <AllowlistEntryRow
        entry={makeEntry()}
        roles={ROLES}
        canManage={false}
        busy={false}
        onRemove={vi.fn()}
      />
    );
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders notes without breaking when present", () => {
    render(
      <AllowlistEntryRow
        entry={makeEntry({ notes: "responsabile stalla nord" })}
        roles={ROLES}
        canManage={false}
        busy={false}
        onRemove={vi.fn()}
      />
    );
    expect(screen.getByText("responsabile stalla nord")).toBeInTheDocument();
  });
});
