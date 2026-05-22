import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { InMemoryRoleRepository } from "@vet/shared/testing";
import type {
  ActorContext,
  Capability,
  Repositories,
  Role,
} from "@vet/shared";
import { RepositoriesProvider } from "../../../../infrastructure/RepositoriesContext";
import { useRoleEditor } from "../useRoleEditor";

function makeUser(
  caps: ReadonlyArray<Capability> = ["roles.manage"]
): ActorContext {
  return {
    uid: "u1",
    email: "u@example.com",
    displayName: "Tester",
    roleId: "admin",
    caps: new Set(caps),
    approved: true,
  };
}

function makeRole(overrides: Partial<Role> = {}): Role {
  return {
    id: "vet-junior",
    name: "Vet junior",
    capabilities: ["activities.create", "aziende.read"],
    locked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: "seed",
    updatedBy: "seed",
    schemaVersion: 1,
    ...overrides,
  };
}

function makeRepos(roleRepo: InMemoryRoleRepository): Repositories {
  return {
    roles: roleRepo,
  } as unknown as Repositories;
}

function makeWrapper(repo: InMemoryRoleRepository) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const repos = makeRepos(repo);
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <RepositoriesProvider value={repos}>{children}</RepositoriesProvider>
    </QueryClientProvider>
  );
}

describe("useRoleEditor", () => {
  let repo: InMemoryRoleRepository;

  beforeEach(() => {
    repo = new InMemoryRoleRepository();
  });

  it("starts in create mode when id is missing", () => {
    const { result } = renderHook(() => useRoleEditor({ user: makeUser() }), {
      wrapper: makeWrapper(repo),
    });
    expect(result.current.isEdit).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.readonly).toBe(false);
    expect(result.current.draftId).toBe("");
    expect(result.current.capabilities.size).toBe(0);
  });

  it("treats 'nuovo' as create mode", () => {
    const { result } = renderHook(
      () => useRoleEditor({ id: "nuovo", user: makeUser() }),
      { wrapper: makeWrapper(repo) }
    );
    expect(result.current.isEdit).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it("loads existing role into form state", async () => {
    await repo.seed(makeRole());
    const { result } = renderHook(
      () => useRoleEditor({ id: "vet-junior", user: makeUser() }),
      { wrapper: makeWrapper(repo) }
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => expect(result.current.name).toBe("Vet junior"));
    expect(result.current.isEdit).toBe(true);
    expect(result.current.capabilities.has("activities.create")).toBe(true);
    expect(result.current.notFound).toBe(false);
  });

  it("flags notFound when the role id does not exist", async () => {
    const { result } = renderHook(
      () => useRoleEditor({ id: "missing", user: makeUser() }),
      { wrapper: makeWrapper(repo) }
    );
    await waitFor(() => expect(result.current.notFound).toBe(true));
  });

  it("marks readonly when role is locked", async () => {
    await repo.seed(makeRole({ id: "admin", locked: true }));
    const { result } = renderHook(
      () => useRoleEditor({ id: "admin", user: makeUser() }),
      { wrapper: makeWrapper(repo) }
    );
    await waitFor(() => expect(result.current.isLocked).toBe(true));
    expect(result.current.readonly).toBe(true);
  });

  it("marks readonly when the user lacks roles.manage", async () => {
    await repo.seed(makeRole());
    const { result } = renderHook(
      () =>
        useRoleEditor({
          id: "vet-junior",
          user: makeUser(["roles.read"]),
        }),
      { wrapper: makeWrapper(repo) }
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.canManage).toBe(false);
    expect(result.current.readonly).toBe(true);
  });

  it("setCapabilities is a no-op when readonly", async () => {
    await repo.seed(makeRole({ locked: true }));
    const { result } = renderHook(
      () => useRoleEditor({ id: "vet-junior", user: makeUser() }),
      { wrapper: makeWrapper(repo) }
    );
    await waitFor(() => expect(result.current.isLocked).toBe(true));
    const before = result.current.capabilities;
    act(() => result.current.setCapabilities(new Set(["aziende.delete"])));
    expect(result.current.capabilities).toBe(before);
  });

  it("rejects invalid id when creating a new role", async () => {
    const { result } = renderHook(() => useRoleEditor({ user: makeUser() }), {
      wrapper: makeWrapper(repo),
    });
    act(() => {
      result.current.setDraftId("Invalid ID");
      result.current.setName("New role");
      result.current.setCapabilities(new Set(["aziende.read"]));
    });
    let outcome;
    await act(async () => {
      outcome = await result.current.save();
    });
    expect(outcome).toMatchObject({ kind: "error" });
    expect(await repo.getById("Invalid ID")).toBeNull();
  });

  it("creates a new role on save when inputs are valid", async () => {
    const { result } = renderHook(() => useRoleEditor({ user: makeUser() }), {
      wrapper: makeWrapper(repo),
    });
    act(() => {
      result.current.setDraftId("vet-trial");
      result.current.setName("Vet trial");
      result.current.setDescription("trial role");
      result.current.setCapabilities(new Set(["activities.create"]));
    });
    let outcome;
    await act(async () => {
      outcome = await result.current.save();
    });
    expect(outcome).toEqual({ kind: "saved" });
    const created = await repo.getById("vet-trial");
    expect(created).not.toBeNull();
    expect(created?.name).toBe("Vet trial");
    expect(created?.capabilities).toContain("activities.create");
  });

  it("updates an existing role on save", async () => {
    await repo.seed(makeRole());
    const { result } = renderHook(
      () => useRoleEditor({ id: "vet-junior", user: makeUser() }),
      { wrapper: makeWrapper(repo) }
    );
    await waitFor(() => expect(result.current.name).toBe("Vet junior"));
    act(() => {
      result.current.setName("Vet renamed");
      result.current.setCapabilities(new Set(["aziende.read"]));
    });
    await act(async () => {
      await result.current.save();
    });
    const updated = await repo.getById("vet-junior");
    expect(updated?.name).toBe("Vet renamed");
    expect(updated?.capabilities).toEqual(["aziende.read"]);
  });

  it("save refuses when there is no user", async () => {
    const { result } = renderHook(() => useRoleEditor({ user: null }), {
      wrapper: makeWrapper(repo),
    });
    let outcome;
    await act(async () => {
      outcome = await result.current.save();
    });
    expect(outcome).toMatchObject({ kind: "error" });
  });

  it("remove deletes the role when allowed", async () => {
    await repo.seed(makeRole());
    const { result } = renderHook(
      () => useRoleEditor({ id: "vet-junior", user: makeUser() }),
      { wrapper: makeWrapper(repo) }
    );
    await waitFor(() => expect(result.current.name).toBe("Vet junior"));
    await act(async () => {
      await result.current.remove();
    });
    expect(await repo.getById("vet-junior")).toBeNull();
  });

  it("remove refuses in create mode", async () => {
    const { result } = renderHook(() => useRoleEditor({ user: makeUser() }), {
      wrapper: makeWrapper(repo),
    });
    let outcome;
    await act(async () => {
      outcome = await result.current.remove();
    });
    expect(outcome).toMatchObject({ kind: "error" });
  });
});
