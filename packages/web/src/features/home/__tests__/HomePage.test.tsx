import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import type { ActorContext, Capability } from "@vet/shared";
import { ToastProvider } from "../../../shared/ui/Toast";
import { RepositoriesProvider } from "../../../infrastructure/RepositoriesContext";
import { createInMemoryRepositories } from "../../../infrastructure/composition/in-memory";
import { HomePage } from "../HomePage";

const useAuthStateMock = vi.fn();

vi.mock("../../auth", async () => {
  const actual = await vi.importActual<typeof import("../../auth")>("../../auth");
  return {
    ...actual,
    useAuthState: () => useAuthStateMock(),
  };
});

function makeUser(caps: ReadonlyArray<Capability>): ActorContext {
  return {
    uid: "u1",
    email: "u1@vet.com",
    displayName: "Vet One",
    roleId: "amministratore",
    caps: new Set(caps),
    approved: true,
  };
}

function renderHome() {
  const repos = createInMemoryRepositories();
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <RepositoriesProvider value={repos}>
        <ToastProvider>
          <MemoryRouter initialEntries={["/"]}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/riepilogo" element={<div>Dashboard</div>} />
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </RepositoriesProvider>
    </QueryClientProvider>
  );
}

describe("HomePage", () => {
  it("renders a skeleton while auth state is loading", () => {
    useAuthStateMock.mockReturnValue({ loading: true, user: null });
    const { container } = renderHome();
    expect(container.querySelector(".animate-pulse")).not.toBeNull();
  });

  it("redirects vets with activities.read.all to /riepilogo", () => {
    useAuthStateMock.mockReturnValue({
      loading: false,
      user: makeUser(["activities.read.all"]),
    });
    renderHome();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders admin tiles for an amministratore (limitato)", () => {
    useAuthStateMock.mockReturnValue({
      loading: false,
      user: makeUser(["allowlist.read", "audit.read", "roles.read"]),
    });
    renderHome();
    expect(screen.getByRole("heading", { name: "Allowlist" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Audit" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ruoli" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Aziende" })).toBeNull();
  });

  it("shows an empty state when the profile has no available sections", () => {
    useAuthStateMock.mockReturnValue({
      loading: false,
      user: makeUser([]),
    });
    renderHome();
    expect(
      screen.getByText(/Nessuna area disponibile/i)
    ).toBeInTheDocument();
  });
});
