import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ActorContext, Repositories } from "@vet/shared";
import { buildProvidersWrapper } from "../../../__tests__/renderWithProviders";
import { createInMemoryRepositories } from "../../../infrastructure/composition/in-memory";
import { NotFoundPage } from "../NotFoundPage";

function makeActor(): ActorContext {
  return {
    uid: "vet-1",
    email: "vet@example.com",
    displayName: "Vet One",
    roleId: "vet",
    caps: new Set(),
    approved: true,
  };
}

function mount(opts: { user?: ActorContext | null; path?: string }) {
  const repos: Repositories = createInMemoryRepositories();
  if (opts.user) {
    (
      repos.auth as unknown as { setSimulatedUser: (a: ActorContext) => void }
    ).setSimulatedUser(opts.user);
  }
  return render(<NotFoundPage />, {
    wrapper: buildProvidersWrapper({
      repos,
      withRouter: true,
      withToast: true,
      initialEntries: [opts.path ?? "/non-esiste"],
    }),
  });
}

describe("NotFoundPage (anonymous)", () => {
  it("renders a single h1 and the offending path", () => {
    mount({ user: null, path: "/qualcosa/che-non-esiste" });
    expect(
      screen.getByRole("heading", { level: 1, name: /Pagina non trovata/i })
    ).toBeInTheDocument();
    expect(screen.getByText("/qualcosa/che-non-esiste")).toBeInTheDocument();
  });

  it("offers a return link to login rendered as an anchor, not a nested button", () => {
    mount({ user: null });
    const link = screen.getByRole("link", { name: /Torna al login/i });
    expect(link).toHaveAttribute("href", "/login");
    expect(within(link).queryByRole("button")).toBeNull();
  });

  it("breaks a very long unknown path instead of overflowing", () => {
    const long = `/${"segmento-lunghissimo/".repeat(12)}`;
    mount({ user: null, path: long });
    expect(screen.getByText(long)).toHaveClass("break-all");
  });
});

describe("NotFoundPage (authenticated)", () => {
  it("renders the in-shell not-found heading and a return-home link", () => {
    mount({ user: makeActor(), path: "/sezione-mancante" });
    expect(
      screen.getByRole("heading", { level: 1, name: /Pagina non trovata/i })
    ).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /Torna al riepilogo/i });
    expect(link).toHaveAttribute("href", "/");
    expect(within(link).queryByRole("button")).toBeNull();
  });
});
