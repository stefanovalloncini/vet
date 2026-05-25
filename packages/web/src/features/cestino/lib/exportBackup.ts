export interface BackupPayload {
  exportedAt: string;
  exportedBy: string;
  version: 1;
  aziende: unknown[];
  attivita: unknown[];
  reminders: unknown[];
}

export function buildBackupPayload(args: {
  exportedBy: string;
  aziende: unknown[];
  attivita: unknown[];
  reminders: unknown[];
  now?: Date;
}): BackupPayload {
  const now = args.now ?? new Date();
  return {
    exportedAt: now.toISOString(),
    exportedBy: args.exportedBy,
    version: 1,
    aziende: args.aziende,
    attivita: args.attivita,
    reminders: args.reminders,
  };
}

export function backupFilename(now: Date = new Date()): string {
  return `vet-app-backup-${now.toISOString().slice(0, 10)}.json`;
}

export function attivitaCsvFilename(now: Date = new Date()): string {
  return `vet-attivita-${now.toISOString().slice(0, 10)}.csv`;
}

export function triggerJsonDownload(payload: BackupPayload, filename: string): void {
  triggerBlobDownload(
    new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }),
    filename
  );
}

export function triggerCsvDownload(csv: string, filename: string): void {
  triggerBlobDownload(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
    filename
  );
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

const LAST_BACKUP_KEY = "vet.backup.lastAt";

export function markBackupDone(now: number = Date.now()): void {
  try {
    window.localStorage.setItem(LAST_BACKUP_KEY, String(now));
  } catch {
    void 0;
  }
}

export function getLastBackupAt(): number | null {
  try {
    const raw = window.localStorage.getItem(LAST_BACKUP_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}
