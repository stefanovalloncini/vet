export const REMINDER_INTERVAL_MS = 14 * 24 * 60 * 60 * 1000;
export const SHOWN_THROTTLE_MS = 24 * 60 * 60 * 1000;

export interface ReminderDecision {
  show: boolean;
  reason: "never-shown" | "due" | "throttled" | "not-due";
}

export function decideBackupReminder(args: {
  now: number;
  lastBackup: number | null;
  lastShown: number;
  intervalMs?: number;
  throttleMs?: number;
}): ReminderDecision {
  const intervalMs = args.intervalMs ?? REMINDER_INTERVAL_MS;
  const throttleMs = args.throttleMs ?? SHOWN_THROTTLE_MS;
  const recentlyShown = args.now - args.lastShown < throttleMs;
  if (recentlyShown) return { show: false, reason: "throttled" };
  if (args.lastBackup === null) {
    return { show: true, reason: "never-shown" };
  }
  if (args.now - args.lastBackup >= intervalMs) {
    return { show: true, reason: "due" };
  }
  return { show: false, reason: "not-due" };
}

export interface BackupAge {
  kind: "never" | "today" | "yesterday" | "days-ago" | "old";
  days: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function backupAge(
  lastBackup: number | null,
  now: number = Date.now()
): BackupAge {
  if (lastBackup === null) return { kind: "never", days: 0 };
  const days = Math.max(0, Math.floor((now - lastBackup) / DAY_MS));
  if (days < 1) return { kind: "today", days };
  if (days === 1) return { kind: "yesterday", days };
  if (days < 30) return { kind: "days-ago", days };
  return { kind: "old", days };
}
