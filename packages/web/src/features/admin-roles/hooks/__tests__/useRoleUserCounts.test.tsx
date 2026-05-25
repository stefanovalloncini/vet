import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ActorContext, Role } from "@vet/shared";
import { buildProvidersWrapper } from "../../../../__tests__/renderWithProviders";
import { createInMemoryRepositories } from "../../../../infrastructure/composition/in-memory";
import { useRoleUserCounts } from "../useRoleUserCounts";

const ADMIN: ActorContext = {
  uid: "admin",
  email: "admin@example.com",
  displayName: "Admin",
  roleId: "admin",
  caps: new Set(["users.read.all", "users.approve"]),
  approved: true,
};

function role(id: string): Role {
  return {
    id,
    name: id,
    capabilities: [],
    locked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: "seed",
    updatedBy: "seed",
    schemaVersion: 1,
  };
}

describe("useRoleUserCounts", () => {
  it("returns one entry per role with the same id ordering", async () => {
    const repos = createInMemoryRepositories();
    (
      repos.auth as unknown as { setSimulatedUser: (a: ActorContext) => void }
    ).setSimulatedUser(ADMIN);
    const roles = [role("admin"), role("vet"), role("solo-lettura")];
    const { result } = renderHook(() => useRoleUserCounts(roles), {
      wrapper: buildProvidersWrapper({ repos }),
    });
    await waitFor(() => {
      expect(result.current).toHaveLength(3);
    });
    expect(result.current[0]?.roleId).toBe("admin");
    expect(result.current[2]?.roleId).toBe("solo-lettura");
  });

  it("returns empty array when no roles are provided", () => {
    const repos = createInMemoryRepositories();
    (
      repos.auth as unknown as { setSimulatedUser: (a: ActorContext) => void }
    ).setSimulatedUser(ADMIN);
    const { result } = renderHook(() => useRoleUserCounts([]), {
      wrapper: buildProvidersWrapper({ repos }),
    });
    expect(result.current).toEqual([]);
  });

  it("returns count=0 for roles with no assigned users", async () => {
    const repos = createInMemoryRepositories();
    (
      repos.auth as unknown as { setSimulatedUser: (a: ActorContext) => void }
    ).setSimulatedUser(ADMIN);
    const roles = [role("empty-role")];
    const { result } = renderHook(() => useRoleUserCounts(roles), {
      wrapper: buildProvidersWrapper({ repos }),
    });
    await waitFor(() => {
      expect(result.current[0]?.count).toBe(0);
    });
  });
});
