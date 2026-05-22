import { renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import type { ReactNode } from "react";
import type { AuditEvent, Repositories } from "@vet/shared";
import { InMemoryAuditRepository } from "@vet/shared/testing";
import { createInMemoryRepositories } from "../../../../infrastructure/composition/in-memory";
import { RepositoriesProvider } from "../../../../infrastructure/RepositoriesContext";
import { createQueryClient } from "../../../../shared/data/queryClient";
import { useAuditEvents } from "../useAuditEvents";

function buildRepos(audit: InMemoryAuditRepository): Repositories {
  const base = createInMemoryRepositories();
  return { ...base, audit };
}

function wrapWith(repos: Repositories) {
  const client = createQueryClient();
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <RepositoriesProvider value={repos}>{children}</RepositoriesProvider>
    </QueryClientProvider>
  );
}

function makeEvent(overrides: Partial<AuditEvent> = {}): AuditEvent {
  return {
    id: "evt-1",
    at: new Date("2026-05-10T10:00:00.000Z"),
    actorUid: "actor-1",
    actorEmail: "actor@example.com",
    action: "role.update",
    targetType: "role",
    targetId: "vet",
    ...overrides,
  };
}

describe("useAuditEvents", () => {
  it("returns audit events fetched from the repository", async () => {
    const audit = new InMemoryAuditRepository();
    audit.seed(makeEvent());
    audit.seed(
      makeEvent({ id: "evt-2", action: "allowlist.add", targetType: "allowlist" })
    );

    const { result } = renderHook(() => useAuditEvents(), {
      wrapper: wrapWith(buildRepos(audit)),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isError).toBe(false);
    expect(result.current.data).toHaveLength(2);
  });

  it("filters by action when provided", async () => {
    const audit = new InMemoryAuditRepository();
    audit.seed(makeEvent());
    audit.seed(
      makeEvent({ id: "evt-2", action: "allowlist.add", targetType: "allowlist" })
    );

    const { result } = renderHook(
      () => useAuditEvents({ action: "allowlist.add" }),
      { wrapper: wrapWith(buildRepos(audit)) }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0]?.action).toBe("allowlist.add");
  });

  it("returns an empty list when no events match", async () => {
    const audit = new InMemoryAuditRepository();
    const { result } = renderHook(() => useAuditEvents(), {
      wrapper: wrapWith(buildRepos(audit)),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual([]);
  });
});
