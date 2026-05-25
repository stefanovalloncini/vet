import { describe, expect, it } from "vitest";
import { backupFilename, buildBackupPayload } from "../exportBackup";

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
