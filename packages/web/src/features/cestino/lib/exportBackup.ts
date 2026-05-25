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

export function triggerJsonDownload(payload: BackupPayload, filename: string): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
