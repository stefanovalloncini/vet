import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ActorContext, AllowlistEntry } from "@vet/shared";
import { InMemoryAllowlistRepository, InMemoryAuthService } from "@vet/shared/testing";
import { buildProvidersWrapper } from "../../../../__tests__/renderWithProviders";
import { AllowlistTab } from "../AllowlistTab";

const ROLES = [
  { id: "vet", name: "Veterinario" },
  { id: "admin", name: "Amministratore" },
];

const ADMIN: ActorContext = {
  uid: "admin-uid",
  email: "admin@vet.it",
  displayName: "Admin",
  roleId: "admin",
  caps: new Set(["allowlist.manage"]),
  approved: true,
};

function makeEntry(email: string, defaultRoleId = "vet"): AllowlistEntry {
  return {
    emailNorm: email,
    email,
    defaultRoleId,
    invitedAt: new Date("2026-01-15T10:00:00Z"),
    invitedBy: "admin@vet.it",
    schemaVersion: 1,
  };
}

function renderTab(entries: AllowlistEntry[]) {
  const auth = new InMemoryAuthService();
  auth.setSimulatedUser(ADMIN);
  const allowlist = new InMemoryAllowlistRepository();
  return render(
    <AllowlistTab entries={entries} roles={ROLES} loading={false} error={null} />,
    {
      wrapper: buildProvidersWrapper({
        repos: { auth, allowlist },
        withRouter: true,
      }),
    }
  );
}

describe("AllowlistTab", () => {
  it("renders one full-width row per entry inside the cards grid", () => {
    const entries = [
      makeEntry("a.lunghissima.email.davvero@clinica-veterinaria.example.it"),
      makeEntry("breve@vet.it", "admin"),
    ];
    renderTab(entries);

    const rows = screen
      .getAllByText(/@/)
      .map((el) => el.closest("div.sm\\:col-span-2"))
      .filter((el): el is HTMLElement => el !== null);
    expect(rows.length).toBeGreaterThanOrEqual(2);
    for (const row of rows) {
      expect(row.className).toContain("lg:col-span-3");
    }
  });

  it("shows the count label and the add control for managers", () => {
    renderTab([makeEntry("uno@vet.it"), makeEntry("due@vet.it")]);
    expect(screen.getByText("2 email")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Aggiungi/i })
    ).toBeInTheDocument();
  });

  it("renders the empty state when there are no entries", () => {
    renderTab([]);
    expect(screen.getByText(/Nessuna email autorizzata/i)).toBeInTheDocument();
  });
});
