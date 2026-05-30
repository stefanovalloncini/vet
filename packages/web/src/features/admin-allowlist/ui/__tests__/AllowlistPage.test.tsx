import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import type { ActorContext, Capability, Repositories } from "@vet/shared";
import {
  InMemoryAccessRequestRepository,
  InMemoryAllowlistRepository,
  InMemoryAuthService,
  InMemoryRoleRepository,
} from "@vet/shared/testing";
import { buildProvidersWrapper } from "../../../../__tests__/renderWithProviders";
import { allowlistI18n as t } from "../../i18n";
import { AllowlistPage } from "../AllowlistPage";

vi.mock("../../../../shared/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../../shared/ui")>();
  return {
    ...actual,
    AdminLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  };
});

function actor(caps: Capability[]): ActorContext {
  return {
    uid: "admin-1",
    email: "admin@vet.it",
    displayName: "Admin",
    roleId: "amministratore",
    caps: new Set(caps),
    approved: true,
  };
}

function buildRepos(caps: Capability[]): Repositories {
  const auth = new InMemoryAuthService();
  auth.setSimulatedUser(actor(caps));
  return {
    auth,
    allowlist: new InMemoryAllowlistRepository(),
    accessRequests: new InMemoryAccessRequestRepository(),
    roles: new InMemoryRoleRepository(),
  } as unknown as Repositories;
}

function renderPage(caps: Capability[]) {
  return render(<AllowlistPage />, {
    wrapper: buildProvidersWrapper({ repos: buildRepos(caps) }),
  });
}

describe("AllowlistPage tab gating", () => {
  it("shows all three tabs to a full admin (approve + manage)", async () => {
    renderPage(["allowlist.read", "users.approve", "allowlist.manage"]);
    expect(await screen.findByText(t.tabAllowlist)).toBeInTheDocument();
    expect(screen.getByText(t.tabPending)).toBeInTheDocument();
    expect(screen.getByText(t.tabRequests)).toBeInTheDocument();
  });

  it("shows no tabs when the user can neither approve nor manage", async () => {
    renderPage(["allowlist.read"]);
    await screen.findByText(t.title);
    expect(screen.queryByText(t.tabPending)).toBeNull();
    expect(screen.queryByText(t.tabRequests)).toBeNull();
  });

  it("shows the pending tab (not requests) for approve-only", async () => {
    renderPage(["allowlist.read", "users.approve"]);
    expect(await screen.findByText(t.tabPending)).toBeInTheDocument();
    expect(screen.queryByText(t.tabRequests)).toBeNull();
  });

  it("shows the requests tab (not pending) for manage-only", async () => {
    renderPage(["allowlist.read", "allowlist.manage"]);
    expect(await screen.findByText(t.tabRequests)).toBeInTheDocument();
    expect(screen.queryByText(t.tabPending)).toBeNull();
  });
});
