import { beforeEach, describe, expect, it } from "vitest";
import {
  attivitaCsvFilename,
  backupFilename,
  buildBackupPayload,
  getLastBackupAt,
  markBackupDone,
} from "../exportBackup";

describe("buildBackupPayload", () => {
  it("packs the tracked collections with version 1", () => {
    const now = new Date("2026-05-22T10:00:00Z");
    const payload = buildBackupPayload({
      exportedBy: "vet@example.com",
      aziende: [{ id: "a1" }],
      attivita: [{ id: "x1" }, { id: "x2" }],
      reminders: [{ id: "r1" }],
      now,
    });
    expect(payload.version).toBe(1);
    expect(payload.exportedAt).toBe(now.toISOString());
    expect(payload.exportedBy).toBe("vet@example.com");
    expect(payload.aziende).toHaveLength(1);
    expect(payload.attivita).toHaveLength(2);
    expect(payload.reminders).toHaveLength(1);
  });

  it("defaults exportedAt to now when not provided", () => {
    const before = Date.now();
    const payload = buildBackupPayload({
      exportedBy: "",
      aziende: [],
      attivita: [],
      reminders: [],
    });
    const at = Date.parse(payload.exportedAt);
    expect(at).toBeGreaterThanOrEqual(before);
    expect(at).toBeLessThanOrEqual(Date.now());
  });
});

describe("backupFilename", () => {
  it("includes the ISO date prefix", () => {
    expect(backupFilename(new Date("2026-05-22T10:00:00Z"))).toBe(
      "vet-app-backup-2026-05-22.json"
    );
  });
});

describe("attivitaCsvFilename", () => {
  it("uses the .csv extension and the ISO date", () => {
    expect(attivitaCsvFilename(new Date("2026-05-26T08:30:00Z"))).toBe(
      "vet-attivita-2026-05-26.csv"
    );
  });
});

function installStorage(): Storage {
  const store = new Map<string, string>();
  const stub: Storage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key) {
      return store.has(key) ? (store.get(key) as string) : null;
    },
    key(i) {
      return Array.from(store.keys())[i] ?? null;
    },
    removeItem(key) {
      store.delete(key);
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
  };
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: stub,
  });
  return stub;
}

describe("last-backup tracking", () => {
  let storage: Storage;
  beforeEach(() => {
    storage = installStorage();
  });

  it("returns null when no backup was ever marked", () => {
    expect(getLastBackupAt()).toBeNull();
  });

  it("persists and retrieves the timestamp", () => {
    const ts = Date.UTC(2026, 4, 26, 9, 0, 0);
    markBackupDone(ts);
    expect(getLastBackupAt()).toBe(ts);
  });

  it("returns null when localStorage holds a non-numeric value", () => {
    storage.setItem("vet.backup.lastAt", "not-a-number");
    expect(getLastBackupAt()).toBeNull();
  });

  it("uses Date.now() by default", () => {
    const before = Date.now();
    markBackupDone();
    const stored = getLastBackupAt();
    const after = Date.now();
    expect(stored).not.toBeNull();
    expect(stored!).toBeGreaterThanOrEqual(before);
    expect(stored!).toBeLessThanOrEqual(after);
  });
});
