import { render, screen, within } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { ActorContext, Role } from "@vet/shared";
import { InMemoryAuthService } from "@vet/shared/testing";
import { createInMemoryRepositories } from "../../../../infrastructure/composition/in-memory";
import { buildProvidersWrapper } from "../../../../__tests__/renderWithProviders";
import { RolesListPage } from "../RolesListPage";

function makeActor(): ActorContext {
  return {
    uid: "admin-uid",
    email: "admin@vet.it",
    displayName: "Admin",
    roleId: "amministratore",
    caps: new Set(["roles.read", "users.read.all"]),
    approved: true,
  };
}

function makeRole(overrides: Partial<Role> = {}): Role {
  return {
    id: "vet",
    name: "Veterinario",
    description: "Ruolo base",
    capabilities: ["activities.create"],
    locked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: "seed",
    updatedBy: "seed",
    schemaVersion: 1,
    ...overrides,
  };
}

async function mount(seed: Role[]) {
  const auth = new InMemoryAuthService();
  auth.setSimulatedUser(makeActor());
  const repos = { ...createInMemoryRepositories(), auth };
  for (const r of seed) {
    await (repos.roles as { seed: (role: Role) => Promise<void> }).seed(r);
  }
  render(
    <Routes>
      <Route path="/admin/ruoli" element={<RolesListPage />} />
      <Route path="/admin/ruoli/:id" element={<div>editor</div>} />
    </Routes>,
    {
      wrapper: buildProvidersWrapper({
        repos,
        withRouter: true,
        withToast: true,
        initialEntries: ["/admin/ruoli"],
      }),
    }
  );
}

describe("RolesListPage", () => {
  it("renders exactly one h1 and the role name as an h2", async () => {
    await mount([makeRole()]);
    expect(
      await screen.findByRole("heading", { level: 1, name: /Ruoli/i })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { level: 2, name: /Veterinario/i })
    ).toBeInTheDocument();
  });

  it("renders each role card spanning the full grid width", async () => {
    await mount([makeRole()]);
    const heading = await screen.findByRole("heading", {
      level: 2,
      name: /Veterinario/i,
    });
    const card = heading.closest("div.sm\\:col-span-2");
    expect(card).not.toBeNull();
    expect((card as HTMLElement).className).toContain("lg:col-span-3");
  });

  it("marks locked roles with a badge", async () => {
    await mount([makeRole({ id: "admin", name: "Amministratore", locked: true })]);
    const heading = await screen.findByRole("heading", {
      level: 2,
      name: /Amministratore/i,
    });
    const card = heading.closest("a") as HTMLElement;
    expect(within(card).getByText("Bloccato")).toBeInTheDocument();
  });

  it("shows the empty state when there are no roles", async () => {
    await mount([]);
    expect(
      await screen.findByText(/Nessun ruolo definito/i)
    ).toBeInTheDocument();
  });
});
