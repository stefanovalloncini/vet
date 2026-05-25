import { describe, expect, it, vi } from "vitest";
import {
  RETENTION_COUNT,
  isDatedFolderName,
  partitionForRetention,
  runCleanup,
  type CleanupDriveClient,
  type DatedFolder,
} from "../cleanupOldDriveBackups.js";

function makeFolders(names: string[]): DatedFolder[] {
  return names.map((name, idx) => ({ id: `id-${idx + 1}`, name }));
}

function fakeDrive(folders: DatedFolder[]): {
  client: CleanupDriveClient;
  listed: number;
  deleted: string[];
} {
  const state = { listed: 0, deleted: [] as string[] };
  const client: CleanupDriveClient = {
    async listDatedFolders() {
      state.listed += 1;
      return folders;
    },
    async deleteFolder(folderId) {
      state.deleted.push(folderId);
    },
  };
  return {
    client,
    get listed() {
      return state.listed;
    },
    get deleted() {
      return state.deleted;
    },
  };
}

describe("isDatedFolderName", () => {
  it("matches yyyy-mm-dd strings", () => {
    expect(isDatedFolderName("2026-05-24")).toBe(true);
    expect(isDatedFolderName("1999-01-01")).toBe(true);
  });

  it("rejects strings with trailing or leading content", () => {
    expect(isDatedFolderName("2026-05-24-old")).toBe(false);
    expect(isDatedFolderName("backup-2026-05-24")).toBe(false);
  });

  it("rejects non-date names", () => {
    expect(isDatedFolderName("manifest")).toBe(false);
    expect(isDatedFolderName("misc")).toBe(false);
    expect(isDatedFolderName("")).toBe(false);
  });

  it("rejects malformed date-like strings", () => {
    expect(isDatedFolderName("2026-5-24")).toBe(false);
    expect(isDatedFolderName("26-05-24")).toBe(false);
  });
});

describe("partitionForRetention", () => {
  it("keeps the newest N by name when given more than N", () => {
    const folders = makeFolders([
      "2026-05-20",
      "2026-05-24",
      "2026-05-22",
      "2026-05-18",
      "2026-05-23",
      "2026-05-19",
      "2026-05-21",
      "2026-05-17",
    ]);
    const { retained, toDelete } = partitionForRetention(folders, 7);
    expect(retained.map((f) => f.name)).toEqual([
      "2026-05-24",
      "2026-05-23",
      "2026-05-22",
      "2026-05-21",
      "2026-05-20",
      "2026-05-19",
      "2026-05-18",
    ]);
    expect(toDelete.map((f) => f.name)).toEqual(["2026-05-17"]);
  });

  it("filters out non-date folders before partitioning", () => {
    const folders = makeFolders([
      "2026-05-24",
      "misc",
      "2026-05-23",
      "manifest-old",
      "2026-05-22",
    ]);
    const { retained, toDelete } = partitionForRetention(folders, 7);
    expect(retained.map((f) => f.name)).toEqual([
      "2026-05-24",
      "2026-05-23",
      "2026-05-22",
    ]);
    expect(toDelete).toEqual([]);
  });

  it("retains all when fewer than N dated folders exist", () => {
    const folders = makeFolders(["2026-05-24", "2026-05-23", "2026-05-22"]);
    const { retained, toDelete } = partitionForRetention(folders, 7);
    expect(retained).toHaveLength(3);
    expect(toDelete).toEqual([]);
  });

  it("returns empty arrays when input is empty", () => {
    const { retained, toDelete } = partitionForRetention([], 7);
    expect(retained).toEqual([]);
    expect(toDelete).toEqual([]);
  });
});

describe("runCleanup", () => {
  it("deletes the three oldest folders when given ten dated folders", async () => {
    const folders = makeFolders([
      "2026-05-15",
      "2026-05-16",
      "2026-05-17",
      "2026-05-18",
      "2026-05-19",
      "2026-05-20",
      "2026-05-21",
      "2026-05-22",
      "2026-05-23",
      "2026-05-24",
    ]);
    const drive = fakeDrive(folders);
    const result = await runCleanup({ drive: drive.client, rootFolderId: "root" });
    expect(result.deletedCount).toBe(3);
    expect(result.retainedCount).toBe(7);
    expect(result.retainedDates).toEqual([
      "2026-05-24",
      "2026-05-23",
      "2026-05-22",
      "2026-05-21",
      "2026-05-20",
      "2026-05-19",
      "2026-05-18",
    ]);
    expect(result.deletedDates).toEqual([
      "2026-05-17",
      "2026-05-16",
      "2026-05-15",
    ]);
    expect(drive.deleted).toHaveLength(3);
  });

  it("ignores non-date folders and does not delete them", async () => {
    const folders: DatedFolder[] = [
      { id: "d1", name: "2026-05-24" },
      { id: "d2", name: "2026-05-23" },
      { id: "d3", name: "2026-05-22" },
      { id: "d4", name: "2026-05-21" },
      { id: "d5", name: "2026-05-20" },
      { id: "d6", name: "2026-05-19" },
      { id: "d7", name: "2026-05-18" },
      { id: "d8", name: "2026-05-17" },
      { id: "n1", name: "misc" },
      { id: "n2", name: "shared-notes" },
      { id: "n3", name: "2026-05-24-old" },
    ];
    const drive = fakeDrive(folders);
    const result = await runCleanup({ drive: drive.client, rootFolderId: "root" });
    expect(result.deletedCount).toBe(1);
    expect(result.deletedDates).toEqual(["2026-05-17"]);
    expect(drive.deleted).toEqual(["d8"]);
  });

  it("does nothing when fewer than seven dated folders exist", async () => {
    const folders = makeFolders([
      "2026-05-24",
      "2026-05-23",
      "2026-05-22",
      "2026-05-21",
      "2026-05-20",
    ]);
    const drive = fakeDrive(folders);
    const result = await runCleanup({ drive: drive.client, rootFolderId: "root" });
    expect(result.deletedCount).toBe(0);
    expect(result.retainedCount).toBe(5);
    expect(drive.deleted).toEqual([]);
  });

  it("does nothing when exactly seven dated folders exist", async () => {
    const folders = makeFolders([
      "2026-05-24",
      "2026-05-23",
      "2026-05-22",
      "2026-05-21",
      "2026-05-20",
      "2026-05-19",
      "2026-05-18",
    ]);
    const drive = fakeDrive(folders);
    const result = await runCleanup({ drive: drive.client, rootFolderId: "root" });
    expect(result.deletedCount).toBe(0);
    expect(result.retainedCount).toBe(7);
    expect(drive.deleted).toEqual([]);
  });

  it("handles empty input gracefully", async () => {
    const drive = fakeDrive([]);
    const result = await runCleanup({ drive: drive.client, rootFolderId: "root" });
    expect(result.deletedCount).toBe(0);
    expect(result.retainedCount).toBe(0);
    expect(result.retainedDates).toEqual([]);
    expect(result.deletedDates).toEqual([]);
    expect(drive.deleted).toEqual([]);
  });

  it("is idempotent: a second run after pruning deletes nothing more", async () => {
    const folders = makeFolders([
      "2026-05-15",
      "2026-05-16",
      "2026-05-17",
      "2026-05-18",
      "2026-05-19",
      "2026-05-20",
      "2026-05-21",
      "2026-05-22",
      "2026-05-23",
      "2026-05-24",
    ]);
    const state = [...folders];
    const client: CleanupDriveClient = {
      async listDatedFolders() {
        return [...state];
      },
      async deleteFolder(folderId) {
        const idx = state.findIndex((f) => f.id === folderId);
        if (idx >= 0) state.splice(idx, 1);
      },
    };
    const first = await runCleanup({ drive: client, rootFolderId: "root" });
    expect(first.deletedCount).toBe(3);
    expect(state).toHaveLength(7);
    const second = await runCleanup({ drive: client, rootFolderId: "root" });
    expect(second.deletedCount).toBe(0);
    expect(second.retainedCount).toBe(7);
    expect(state).toHaveLength(7);
  });

  it("propagates delete failures", async () => {
    const folders = makeFolders([
      "2026-05-15",
      "2026-05-16",
      "2026-05-17",
      "2026-05-18",
      "2026-05-19",
      "2026-05-20",
      "2026-05-21",
      "2026-05-22",
    ]);
    const client: CleanupDriveClient = {
      async listDatedFolders() {
        return folders;
      },
      deleteFolder: vi.fn().mockRejectedValue(new Error("forbidden")),
    };
    await expect(
      runCleanup({ drive: client, rootFolderId: "root" })
    ).rejects.toThrow("forbidden");
  });

  it("uses default retention of 7", async () => {
    expect(RETENTION_COUNT).toBe(7);
    const folders = makeFolders([
      "2026-05-15",
      "2026-05-16",
      "2026-05-17",
      "2026-05-18",
      "2026-05-19",
      "2026-05-20",
      "2026-05-21",
      "2026-05-22",
    ]);
    const drive = fakeDrive(folders);
    const result = await runCleanup({ drive: drive.client, rootFolderId: "root" });
    expect(result.retainedCount).toBe(7);
    expect(result.deletedCount).toBe(1);
  });
});
