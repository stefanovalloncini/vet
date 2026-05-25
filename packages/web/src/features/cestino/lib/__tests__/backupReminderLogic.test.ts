import { describe, expect, it } from "vitest";
import {
  backupAge,
  decideBackupReminder,
  REMINDER_INTERVAL_MS,
  SHOWN_THROTTLE_MS,
} from "../backupReminderLogic";

const T0 = Date.UTC(2026, 4, 26, 12, 0, 0);

describe("decideBackupReminder", () => {
  it("shows reminder when no backup has ever been made", () => {
    const r = decideBackupReminder({
      now: T0,
      lastBackup: null,
      lastShown: 0,
    });
    expect(r).toEqual({ show: true, reason: "never-shown" });
  });

  it("does NOT show if recently shown (throttled)", () => {
    const r = decideBackupReminder({
      now: T0,
      lastBackup: null,
      lastShown: T0 - 1000,
    });
    expect(r).toEqual({ show: false, reason: "throttled" });
  });

  it("does NOT show when backup is recent", () => {
    const r = decideBackupReminder({
      now: T0,
      lastBackup: T0 - 1000,
      lastShown: 0,
    });
    expect(r).toEqual({ show: false, reason: "not-due" });
  });

  it("shows when last backup is older than 14 days", () => {
    const r = decideBackupReminder({
      now: T0,
      lastBackup: T0 - REMINDER_INTERVAL_MS - 1,
      lastShown: 0,
    });
    expect(r).toEqual({ show: true, reason: "due" });
  });

  it("treats exactly-14-days as due", () => {
    const r = decideBackupReminder({
      now: T0,
      lastBackup: T0 - REMINDER_INTERVAL_MS,
      lastShown: 0,
    });
    expect(r).toEqual({ show: true, reason: "due" });
  });

  it("treats exactly-24h-since-shown as no-longer-throttled", () => {
    const r = decideBackupReminder({
      now: T0,
      lastBackup: null,
      lastShown: T0 - SHOWN_THROTTLE_MS,
    });
    expect(r.show).toBe(true);
  });

  it("respects custom intervalMs / throttleMs overrides", () => {
    const r1 = decideBackupReminder({
      now: T0,
      lastBackup: T0 - 1_000_000,
      lastShown: 0,
      intervalMs: 500_000,
    });
    expect(r1.show).toBe(true);
    const r2 = decideBackupReminder({
      now: T0,
      lastBackup: null,
      lastShown: T0 - 500,
      throttleMs: 1_000,
    });
    expect(r2.show).toBe(false);
  });

  it("throttle wins over due (avoids duplicate toasts in same day)", () => {
    const r = decideBackupReminder({
      now: T0,
      lastBackup: T0 - REMINDER_INTERVAL_MS * 5,
      lastShown: T0 - 1000,
    });
    expect(r).toEqual({ show: false, reason: "throttled" });
  });
});

describe("backupAge", () => {
  const DAY = 24 * 60 * 60 * 1000;
  const NOW = Date.UTC(2026, 4, 26, 12, 0, 0);

  it("returns kind 'never' when no backup exists", () => {
    expect(backupAge(null, NOW)).toEqual({ kind: "never", days: 0 });
  });

  it("returns 'today' for a backup taken a few hours ago", () => {
    expect(backupAge(NOW - 1000, NOW)).toEqual({ kind: "today", days: 0 });
    expect(backupAge(NOW - DAY + 1, NOW).kind).toBe("today");
  });

  it("returns 'yesterday' for a backup ~24h-48h ago", () => {
    expect(backupAge(NOW - DAY, NOW)).toEqual({ kind: "yesterday", days: 1 });
    expect(backupAge(NOW - 2 * DAY + 1, NOW).kind).toBe("yesterday");
  });

  it("returns 'days-ago' for 2-29 days", () => {
    expect(backupAge(NOW - 5 * DAY, NOW)).toEqual({
      kind: "days-ago",
      days: 5,
    });
    expect(backupAge(NOW - 29 * DAY, NOW)).toEqual({
      kind: "days-ago",
      days: 29,
    });
  });

  it("returns 'old' for >=30 days", () => {
    expect(backupAge(NOW - 30 * DAY, NOW).kind).toBe("old");
    expect(backupAge(NOW - 365 * DAY, NOW).kind).toBe("old");
  });

  it("clamps negative diffs (future timestamp due to clock skew) to today", () => {
    expect(backupAge(NOW + DAY, NOW)).toEqual({ kind: "today", days: 0 });
  });
});
