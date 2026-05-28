import { describe, expect, it } from "vitest";
import {
  ATTIVITA_DEPENDENT_KEYS,
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

  it("keys the azienda detail under the aziende prefix so list invalidations refresh it", () => {
    expect(queryKeys.aziendaDetail("az1")).toEqual(["aziende", "az1", "detail"]);
  });

  it("exposes reminders keys with and without filters", () => {
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

  it("exposes role user count keys under a shared prefix", () => {
    expect(queryKeys.roleUserCounts).toEqual(["roleUserCount"]);
    expect(queryKeys.roleUserCount("vet")).toEqual(["roleUserCount", "vet"]);
  });
});

describe("ATTIVITA_DEPENDENT_KEYS", () => {
  it("includes every read view derived from attivita", () => {
    const top = ATTIVITA_DEPENDENT_KEYS.map((k) => k[0]);
    for (const key of [
      "attivita",
      "agenda",
      "vetStats",
      "dashboardStats",
      "statistiche",
      "trash",
      "riepilogoPdf",
    ]) {
      expect(top).toContain(key);
    }
  });
});
