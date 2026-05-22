import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { InMemoryAccessRequestRepository } from "@vet/shared/testing";
import type { Repositories } from "@vet/shared";
import { RepositoriesProvider } from "../../../../infrastructure/RepositoriesContext";
import { useAccessRequests } from "../useAccessRequests";

function makeWrapper(repo: InMemoryAccessRequestRepository) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const repos = { accessRequests: repo } as unknown as Repositories;
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <RepositoriesProvider value={repos}>{children}</RepositoriesProvider>
    </QueryClientProvider>
  );
}

describe("useAccessRequests", () => {
  let repo: InMemoryAccessRequestRepository;

  beforeEach(() => {
    repo = new InMemoryAccessRequestRepository();
  });

  it("resolves to an empty list when no requests exist", async () => {
    const { result } = renderHook(() => useAccessRequests(), {
      wrapper: makeWrapper(repo),
    });
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("returns recorded access requests sorted by recent activity", async () => {
    repo.recordAttemptForTest({
      email: "first@vet.it",
      now: new Date("2026-01-01T10:00:00Z"),
    });
    repo.recordAttemptForTest({
      email: "second@vet.it",
      now: new Date("2026-02-01T10:00:00Z"),
    });

    const { result } = renderHook(() => useAccessRequests(), {
      wrapper: makeWrapper(repo),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items.map((r) => r.email)).toEqual([
      "second@vet.it",
      "first@vet.it",
    ]);
  });
});
