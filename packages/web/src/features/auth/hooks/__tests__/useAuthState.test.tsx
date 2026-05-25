import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ActorContext } from "@vet/shared";
import { buildProvidersWrapper } from "../../../../__tests__/renderWithProviders";
import { createInMemoryRepositories } from "../../../../infrastructure/composition/in-memory";
import { useAuthState } from "../useAuthState";

const VET: ActorContext = {
  uid: "u1",
  email: "vet@example.com",
  displayName: "Vet One",
  roleId: "vet",
  caps: new Set(["activities.read.all"]),
  approved: true,
};

describe("useAuthState", () => {
  it("returns loading=true and user=null when no user is signed in", () => {
    const repos = createInMemoryRepositories();
    const { result } = renderHook(() => useAuthState(), {
      wrapper: buildProvidersWrapper({ repos }),
    });
    expect(result.current.user).toBeNull();
  });

  it("returns the current user when one is set", () => {
    const repos = createInMemoryRepositories();
    (
      repos.auth as unknown as { setSimulatedUser: (a: ActorContext) => void }
    ).setSimulatedUser(VET);
    const { result } = renderHook(() => useAuthState(), {
      wrapper: buildProvidersWrapper({ repos }),
    });
    expect(result.current.user?.uid).toBe(VET.uid);
    expect(result.current.user?.caps.has("activities.read.all")).toBe(true);
  });

  it("updates when the auth subscription fires", () => {
    const repos = createInMemoryRepositories();
    const { result } = renderHook(() => useAuthState(), {
      wrapper: buildProvidersWrapper({ repos }),
    });
    expect(result.current.user).toBeNull();
    act(() => {
      (
        repos.auth as unknown as { setSimulatedUser: (a: ActorContext) => void }
      ).setSimulatedUser(VET);
    });
    expect(result.current.user?.uid).toBe(VET.uid);
    expect(result.current.loading).toBe(false);
  });
});
