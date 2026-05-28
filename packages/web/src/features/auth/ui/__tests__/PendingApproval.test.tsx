import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ActorContext } from "@vet/shared";
import { buildProvidersWrapper } from "../../../../__tests__/renderWithProviders";
import { createInMemoryRepositories } from "../../../../infrastructure/composition/in-memory";
import { PendingApproval } from "../PendingApproval";

function makeActor(overrides: Partial<ActorContext> = {}): ActorContext {
  return {
    uid: "vet-1",
    email: "vet@example.com",
    displayName: "Vet One",
    roleId: "vet",
    caps: new Set(),
    approved: false,
    ...overrides,
  };
}

function mount(user: ActorContext | null) {
  const repos = createInMemoryRepositories();
  if (user) {
    (
      repos.auth as unknown as { setSimulatedUser: (a: ActorContext) => void }
    ).setSimulatedUser(user);
  }
  return {
    repos,
    ...render(<PendingApproval />, {
      wrapper: buildProvidersWrapper({ repos, withRouter: true }),
    }),
  };
}

describe("PendingApproval", () => {
  it("renders a single h1 describing the pending state", () => {
    mount(makeActor());
    expect(
      screen.getByRole("heading", { level: 1, name: /in attesa di approvazione/i })
    ).toBeInTheDocument();
  });

  it("shows the signed-in email", () => {
    mount(makeActor({ email: "mario.rossi@studio.it" }));
    expect(screen.getByText("mario.rossi@studio.it")).toBeInTheDocument();
  });

  it("renders an em dash placeholder when the email is missing", () => {
    mount(null);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("surfaces the queued status as a labelled badge", () => {
    mount(makeActor());
    expect(screen.getByText("In coda")).toBeInTheDocument();
  });

  it("signs out when Esci is pressed", () => {
    const { repos } = mount(makeActor());
    const spy = vi.spyOn(repos.auth, "signOut").mockResolvedValue();
    fireEvent.click(screen.getByRole("button", { name: /Esci/i }));
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("does not overflow with a very long email", () => {
    const long = `${"a".repeat(120)}@studio-veterinario-lombardia.example.it`;
    mount(makeActor({ email: long }));
    const value = screen.getByText(long);
    expect(value).toHaveClass("break-all");
  });
});
