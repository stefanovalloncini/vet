import { render, screen, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import type { ActorContext, Capability } from "@vet/shared";
import { InMemoryAuthService } from "@vet/shared/testing";
import { RepositoriesProvider } from "../../../infrastructure/RepositoriesContext";
import { createInMemoryRepositories } from "../../../infrastructure/composition/in-memory";
import { CapabilityGate } from "../CapabilityGate";

function makeUser(caps: readonly Capability[]): ActorContext {
  return {
    uid: "u1",
    email: "u1@example.com",
    displayName: "U One",
    roleId: "role-test",
    caps: new Set(caps),
    approved: true,
  };
}

function mount(caps: readonly Capability[] | null, ui: ReactNode) {
  const repos = createInMemoryRepositories();
  const auth = repos.auth as InMemoryAuthService;
  if (caps !== null) auth.setSimulatedUser(makeUser(caps));
  const utils = render(
    <RepositoriesProvider value={repos}>{ui}</RepositoriesProvider>
  );
  return { auth, ...utils };
}

describe("CapabilityGate", () => {
  it("renders children when single cap is satisfied", () => {
    mount(
      ["activities.create"],
      <CapabilityGate cap="activities.create">
        <span>visible</span>
      </CapabilityGate>
    );
    expect(screen.getByText("visible")).toBeInTheDocument();
  });

  it("renders fallback when single cap is missing", () => {
    mount(
      ["aziende.read"],
      <CapabilityGate
        cap="activities.create"
        fallback={<span>denied</span>}
      >
        <span>visible</span>
      </CapabilityGate>
    );
    expect(screen.queryByText("visible")).toBeNull();
    expect(screen.getByText("denied")).toBeInTheDocument();
  });

  it("renders null by default when fallback is omitted and check fails", () => {
    const { container } = mount(
      null,
      <CapabilityGate cap="activities.create">
        <span>visible</span>
      </CapabilityGate>
    );
    expect(container.textContent).toBe("");
  });

  it("renders children only when all required caps are present (allOf)", () => {
    mount(
      ["aziende.read", "activities.create"],
      <CapabilityGate
        allOf={["aziende.read", "activities.create"]}
        fallback={<span>denied</span>}
      >
        <span>visible</span>
      </CapabilityGate>
    );
    expect(screen.getByText("visible")).toBeInTheDocument();
  });

  it("renders fallback when any required cap is missing (allOf)", () => {
    mount(
      ["aziende.read"],
      <CapabilityGate
        allOf={["aziende.read", "activities.create"]}
        fallback={<span>denied</span>}
      >
        <span>visible</span>
      </CapabilityGate>
    );
    expect(screen.getByText("denied")).toBeInTheDocument();
  });

  it("renders children when at least one cap is present (anyOf)", () => {
    mount(
      ["aziende.read"],
      <CapabilityGate
        anyOf={["activities.create", "aziende.read"]}
        fallback={<span>denied</span>}
      >
        <span>visible</span>
      </CapabilityGate>
    );
    expect(screen.getByText("visible")).toBeInTheDocument();
  });

  it("renders fallback when no caps in anyOf are present", () => {
    mount(
      ["audit.read"],
      <CapabilityGate
        anyOf={["activities.create", "aziende.read"]}
        fallback={<span>denied</span>}
      >
        <span>visible</span>
      </CapabilityGate>
    );
    expect(screen.getByText("denied")).toBeInTheDocument();
  });

  it("re-renders children when caps gain the required capability", () => {
    const { auth } = mount(
      ["aziende.read"],
      <CapabilityGate
        cap="activities.create"
        fallback={<span>denied</span>}
      >
        <span>visible</span>
      </CapabilityGate>
    );
    expect(screen.getByText("denied")).toBeInTheDocument();
    act(() => {
      auth.setSimulatedUser(makeUser(["activities.create"]));
    });
    expect(screen.getByText("visible")).toBeInTheDocument();
  });

  it("renders fallback when there is no signed-in user", () => {
    mount(
      null,
      <CapabilityGate
        cap="activities.create"
        fallback={<span>denied</span>}
      >
        <span>visible</span>
      </CapabilityGate>
    );
    expect(screen.getByText("denied")).toBeInTheDocument();
  });
});
