import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  InMemoryAllowlistRepository,
  InMemoryRoleRepository,
} from "@vet/shared/testing";
import type { Repositories } from "@vet/shared";
import { RepositoriesProvider } from "../../../../infrastructure/RepositoriesContext";
import {
  useAddAllowlistEntry,
  useAllowlist,
  useRemoveAllowlistEntry,
} from "../useAllowlist";

interface Bench {
  allowlist: InMemoryAllowlistRepository;
  roles: InMemoryRoleRepository;
  wrapper: ({ children }: { children: ReactNode }) => JSX.Element;
}

function makeBench(): Bench {
  const allowlist = new InMemoryAllowlistRepository();
  const roles = new InMemoryRoleRepository();
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const repos = { allowlist, roles } as unknown as Repositories;
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <RepositoriesProvider value={repos}>{children}</RepositoriesProvider>
    </QueryClientProvider>
  );
  return { allowlist, roles, wrapper };
}

describe("useAllowlist", () => {
  let bench: Bench;

  beforeEach(() => {
    bench = makeBench();
  });

  it("starts loading and resolves to empty arrays", async () => {
    const { result } = renderHook(() => useAllowlist(), {
      wrapper: bench.wrapper,
    });
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.entries).toEqual([]);
    expect(result.current.roles).toEqual([]);
  });

  it("returns entries sorted by email and roles sorted by name", async () => {
    await bench.allowlist.add(
      { email: "zeta@vet.it", defaultRoleId: "vet" },
      "actor"
    );
    await bench.allowlist.add(
      { email: "alpha@vet.it", defaultRoleId: "vet" },
      "actor"
    );
    await bench.roles.seed({
      id: "vet",
      name: "Zeta",
      capabilities: [],
      locked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: "seed",
      updatedBy: "seed",
      schemaVersion: 1,
    });
    await bench.roles.seed({
      id: "admin",
      name: "Alfa",
      capabilities: [],
      locked: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: "seed",
      updatedBy: "seed",
      schemaVersion: 1,
    });

    const { result } = renderHook(() => useAllowlist(), {
      wrapper: bench.wrapper,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.entries.map((e) => e.email)).toEqual([
      "alpha@vet.it",
      "zeta@vet.it",
    ]);
    expect(result.current.roles.map((r) => r.name)).toEqual(["Alfa", "Zeta"]);
  });

  it("add mutation invalidates and refetches the list", async () => {
    const { result } = renderHook(
      () => ({ list: useAllowlist(), add: useAddAllowlistEntry() }),
      { wrapper: bench.wrapper }
    );
    await waitFor(() => expect(result.current.list.loading).toBe(false));
    expect(result.current.list.entries).toHaveLength(0);

    await result.current.add.mutateAsync({
      input: { email: "new@vet.it", defaultRoleId: "vet" },
      actor: "u1",
    });

    await waitFor(() =>
      expect(result.current.list.entries).toHaveLength(1)
    );
    expect(result.current.list.entries[0]?.email).toBe("new@vet.it");
  });

  it("remove mutation invalidates and refetches the list", async () => {
    await bench.allowlist.add(
      { email: "drop@vet.it", defaultRoleId: "vet" },
      "actor"
    );
    const { result } = renderHook(
      () => ({ list: useAllowlist(), remove: useRemoveAllowlistEntry() }),
      { wrapper: bench.wrapper }
    );
    await waitFor(() => expect(result.current.list.entries).toHaveLength(1));

    await result.current.remove.mutateAsync("drop@vet.it");

    await waitFor(() =>
      expect(result.current.list.entries).toHaveLength(0)
    );
  });
});
