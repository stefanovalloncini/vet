import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { InMemoryRoleRepository } from "@vet/shared/testing";
import type { Repositories, Role } from "@vet/shared";
import { RepositoriesProvider } from "../../../../infrastructure/RepositoriesContext";
import { useRoles, useCreateRole } from "../useRoles";

function makeRole(overrides: Partial<Role> = {}): Role {
  return {
    id: "vet-junior",
    name: "Vet junior",
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

function makeWrapper(repo: InMemoryRoleRepository) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const repos = { roles: repo } as unknown as Repositories;
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <RepositoriesProvider value={repos}>{children}</RepositoriesProvider>
    </QueryClientProvider>
  );
}

describe("useRoles", () => {
  let repo: InMemoryRoleRepository;

  beforeEach(() => {
    repo = new InMemoryRoleRepository();
  });

  it("returns roles sorted by name", async () => {
    await repo.seed(makeRole({ id: "z-role", name: "Zeta" }));
    await repo.seed(makeRole({ id: "a-role", name: "Alpha" }));

    const { result } = renderHook(() => useRoles(), {
      wrapper: makeWrapper(repo),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.map((r) => r.name)).toEqual(["Alpha", "Zeta"]);
  });

  it("starts loading then resolves to an empty array", async () => {
    const { result } = renderHook(() => useRoles(), {
      wrapper: makeWrapper(repo),
    });
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it("create mutation invalidates and refetches the list", async () => {
    const wrapper = makeWrapper(repo);
    const { result } = renderHook(
      () => ({ list: useRoles(), create: useCreateRole() }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.list.isSuccess).toBe(true));
    expect(result.current.list.data).toEqual([]);

    await result.current.create.mutateAsync({
      id: "vet-trial",
      input: { name: "Vet trial", capabilities: ["activities.create"] },
      actor: "u1",
    });

    await waitFor(() => expect(result.current.list.data?.length).toBe(1));
    expect(result.current.list.data?.[0]?.name).toBe("Vet trial");
  });
});
