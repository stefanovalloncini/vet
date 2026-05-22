import { renderHook, act } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import type { ActorContext, Capability, Repositories } from "@vet/shared";
import { InMemoryAuthService } from "@vet/shared/testing";
import { RepositoriesProvider } from "../../../infrastructure/RepositoriesContext";
import { createInMemoryRepositories } from "../../../infrastructure/composition/in-memory";
import { useCapabilities, useCapability } from "../useCapability";

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

function wrapWith(repos: Repositories) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      RepositoriesProvider,
      { value: repos, children }
    );
  };
}

interface HookHarness<T> {
  result: { current: T };
  auth: InMemoryAuthService;
}

function setupHook<T>(
  caps: readonly Capability[] | null,
  hook: () => T
): HookHarness<T> {
  const repos = createInMemoryRepositories();
  const auth = repos.auth as InMemoryAuthService;
  if (caps !== null) auth.setSimulatedUser(makeUser(caps));
  const { result } = renderHook(hook, { wrapper: wrapWith(repos) });
  return { result, auth };
}

describe("useCapability", () => {
  it("returns true when the user has the capability", () => {
    const { result } = setupHook(["activities.create"], () =>
      useCapability("activities.create")
    );
    expect(result.current).toBe(true);
  });

  it("returns false when the user lacks the capability", () => {
    const { result } = setupHook(["aziende.read"], () =>
      useCapability("activities.create")
    );
    expect(result.current).toBe(false);
  });

  it("returns false when there is no signed-in user", () => {
    const { result } = setupHook(null, () => useCapability("activities.create"));
    expect(result.current).toBe(false);
  });

  it("returns stable identity across renders when caps are unchanged", () => {
    const { result, auth } = setupHook(["activities.create"], () =>
      useCapability("activities.create")
    );
    const before = result.current;
    act(() => {
      auth.setSimulatedUser(makeUser(["activities.create"]));
    });
    expect(result.current).toBe(before);
  });

  it("updates when the user's caps change", () => {
    const { result, auth } = setupHook(["aziende.read"], () =>
      useCapability("activities.create")
    );
    expect(result.current).toBe(false);
    act(() => {
      auth.setSimulatedUser(makeUser(["activities.create"]));
    });
    expect(result.current).toBe(true);
  });
});

describe("useCapabilities", () => {
  it("returns a record of booleans keyed by capability", () => {
    const { result } = setupHook(["aziende.read", "activities.create"], () =>
      useCapabilities("aziende.read", "activities.create", "audit.read")
    );
    expect(result.current).toEqual({
      "aziende.read": true,
      "activities.create": true,
      "audit.read": false,
    });
  });

  it("returns all false when there is no user", () => {
    const { result } = setupHook(null, () =>
      useCapabilities("aziende.read", "activities.create")
    );
    expect(result.current).toEqual({
      "aziende.read": false,
      "activities.create": false,
    });
  });

  it("memoizes the result object across renders when caps don't change", () => {
    const { result, auth } = setupHook(["aziende.read"], () =>
      useCapabilities("aziende.read", "activities.create")
    );
    const before = result.current;
    act(() => {
      auth.setSimulatedUser(makeUser(["aziende.read"]));
    });
    expect(result.current).toBe(before);
  });
});
