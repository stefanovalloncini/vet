import { describe, expect, it } from "vitest";
import {
  createQueryClient,
  DEFAULT_GC_TIME_MS,
  DEFAULT_STALE_TIME_MS,
  queryKeys,
} from "../queryClient";

describe("createQueryClient", () => {
  it("applies the project default query options", () => {
    const client = createQueryClient();
    const defaults = client.getDefaultOptions();

    expect(defaults.queries?.staleTime).toBe(DEFAULT_STALE_TIME_MS);
    expect(defaults.queries?.gcTime).toBe(DEFAULT_GC_TIME_MS);
    expect(defaults.queries?.refetchOnWindowFocus).toBe(false);
    expect(defaults.queries?.retry).toBe(1);
  });

  it("uses the documented stale and gc constants", () => {
    expect(DEFAULT_STALE_TIME_MS).toBe(30_000);
    expect(DEFAULT_GC_TIME_MS).toBe(300_000);
  });

  it("returns a fresh client instance each call", () => {
    expect(createQueryClient()).not.toBe(createQueryClient());
  });
});

describe("queryKeys", () => {
  it("exposes stable top-level keys", () => {
    expect(queryKeys.aziende).toEqual(["aziende"]);
    expect(queryKeys.tipiAttivita).toEqual(["tipiAttivita"]);
    expect(queryKeys.allowlist).toEqual(["allowlist"]);
  });

  it("namespaces filtered keys with their arguments", () => {
    expect(queryKeys.attivita({ from: "2026-01-01" })).toEqual([
      "attivita",
      { from: "2026-01-01" },
    ]);
    expect(queryKeys.attivita()).toEqual(["attivita", {}]);
    expect(queryKeys.azienda("az1")).toEqual(["aziende", "az1"]);
  });

  it("exposes payments and reminders keys with and without filters", () => {
    expect(queryKeys.payments()).toEqual(["payments", {}]);
    expect(queryKeys.payments({ aziendaId: "az1" })).toEqual([
      "payments",
      { aziendaId: "az1" },
    ]);
    expect(queryKeys.reminders()).toEqual(["reminders", {}]);
    expect(queryKeys.reminders({ onlyOpen: true })).toEqual([
      "reminders",
      { onlyOpen: true },
    ]);
  });

  it("namespaces agenda by date range", () => {
    expect(queryKeys.agenda({ from: 1, to: 2 })).toEqual([
      "agenda",
      { from: 1, to: 2 },
    ]);
    expect(queryKeys.agenda()).toEqual(["agenda", {}]);
  });

  it("namespaces trash by filters", () => {
    expect(queryKeys.trash({ ownerUid: "u1" })).toEqual([
      "trash",
      { ownerUid: "u1" },
    ]);
    expect(queryKeys.trash()).toEqual(["trash", {}]);
  });
});
