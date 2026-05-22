import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { InMemoryUserRepository } from "@vet/shared/testing";
import type { Repositories, User } from "@vet/shared";
import { RepositoriesProvider } from "../../../../infrastructure/RepositoriesContext";
import {
  useApprovePendingUser,
  usePendingUsers,
  useRejectPendingUser,
} from "../usePendingUsers";

function pendingUser(uid: string, email: string): User {
  return {
    uid,
    email,
    displayName: "Tester",
    roleId: "vet",
    approved: false,
    disabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    schemaVersion: 1,
  };
}

function makeWrapper(users: InMemoryUserRepository) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const repos = { users } as unknown as Repositories;
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <RepositoriesProvider value={repos}>{children}</RepositoriesProvider>
    </QueryClientProvider>
  );
}

describe("usePendingUsers", () => {
  let users: InMemoryUserRepository;

  beforeEach(() => {
    users = new InMemoryUserRepository();
  });

  it("resolves to an empty list when nothing is pending", async () => {
    const { result } = renderHook(() => usePendingUsers(), {
      wrapper: makeWrapper(users),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("returns users awaiting approval", async () => {
    users.setForTest("u1", pendingUser("u1", "a@vet.it"));
    users.setForTest("u2", pendingUser("u2", "b@vet.it"));
    const { result } = renderHook(() => usePendingUsers(), {
      wrapper: makeWrapper(users),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items.map((u) => u.uid).sort()).toEqual(["u1", "u2"]);
  });

  it("approve mutation refetches the pending list", async () => {
    users.setForTest("u1", pendingUser("u1", "a@vet.it"));
    const wrapper = makeWrapper(users);
    const { result } = renderHook(
      () => ({ list: usePendingUsers(), approve: useApprovePendingUser() }),
      { wrapper }
    );
    await waitFor(() => expect(result.current.list.items).toHaveLength(1));

    await result.current.approve.mutateAsync({ uid: "u1", roleId: "vet" });

    await waitFor(() => expect(result.current.list.items).toHaveLength(0));
  });

  it("reject mutation refetches the pending list", async () => {
    users.setForTest("u1", pendingUser("u1", "a@vet.it"));
    const wrapper = makeWrapper(users);
    const { result } = renderHook(
      () => ({ list: usePendingUsers(), reject: useRejectPendingUser() }),
      { wrapper }
    );
    await waitFor(() => expect(result.current.list.items).toHaveLength(1));

    await result.current.reject.mutateAsync("u1");

    await waitFor(() => expect(result.current.list.items).toHaveLength(0));
  });
});
