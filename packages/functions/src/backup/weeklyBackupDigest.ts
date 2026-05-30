import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions/v2";
import { defineSecret } from "firebase-functions/params";
import { google, type drive_v3 } from "googleapis";
import { getRepositories } from "../infrastructure/composition.js";
import { escapeHtml } from "../shared/html.js";
import type { BackupManifest } from "./dailyDriveExport.js";

const DRIVE_BACKUP_KEY = defineSecret("drive-backup-key");
const DRIVE_BACKUP_FOLDER_ID = defineSecret("drive-backup-folder-id");
const DIGEST_RECIPIENT = defineSecret("drive-backup-digest-recipient");

export interface DigestDay {
  date: string;
  folderId: string;
  folderLink: string;
  manifest: BackupManifest | null;
}

export interface DigestReadClient {
  listDayFolders(rootFolderId: string, limit: number): Promise<Array<{ id: string; name: string }>>;
  loadManifest(folderId: string): Promise<BackupManifest | null>;
  folderLink(folderId: string): string;
}

export function makeDigestReadClient(input: { serviceAccountJson: string }): DigestReadClient {
  const credentials = JSON.parse(input.serviceAccountJson) as {
    client_email: string;
    private_key: string;
  };
  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });
  const drive = google.drive({ version: "v3", auth });
  return {
    async listDayFolders(rootFolderId, limit) {
      const q = [
        `'${rootFolderId}' in parents`,
        "mimeType = 'application/vnd.google-apps.folder'",
        "trashed = false",
      ].join(" and ");
      const res = await drive.files.list({
        q,
        orderBy: "name desc",
        pageSize: limit,
        fields: "files(id, name)",
        spaces: "drive",
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });
      const items = res.data.files ?? [];
      return items
        .filter((f): f is drive_v3.Schema$File & { id: string; name: string } =>
          typeof f.id === "string" && typeof f.name === "string"
        )
        .map((f) => ({ id: f.id, name: f.name }));
    },
    async loadManifest(folderId) {
      const q = [
        `'${folderId}' in parents`,
        "name contains 'manifest'",
        "mimeType = 'application/json'",
        "trashed = false",
      ].join(" and ");
      const list = await drive.files.list({
        q,
        orderBy: "name desc",
        pageSize: 1,
        fields: "files(id, name)",
        spaces: "drive",
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });
      const id = list.data.files?.[0]?.id;
      if (!id) return null;
      const get = await drive.files.get(
        { fileId: id, alt: "media", supportsAllDrives: true },
        { responseType: "text" }
      );
      const raw = typeof get.data === "string" ? get.data : JSON.stringify(get.data);
      try {
        return JSON.parse(raw) as BackupManifest;
      } catch {
        return null;
      }
    },
    folderLink(folderId) {
      return `https://drive.google.com/drive/folders/${folderId}`;
    },
  };
}

export { escapeHtml };

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function renderDigestHtml(input: {
  weekLabel: string;
  days: DigestDay[];
}): string {
  const rows = input.days
    .map((day) => {
      const m = day.manifest;
      const counts = m
        ? `${m.totalRows} righe, ${escapeHtml(formatBytes(m.totalBytes))}`
        : "manifest non disponibile";
      return `<tr><td style="padding:6px 12px">${escapeHtml(day.date)}</td><td style="padding:6px 12px">${counts}</td><td style="padding:6px 12px"><a href="${escapeHtml(day.folderLink)}">apri cartella</a></td></tr>`;
    })
    .join("");
  return `<!doctype html><html lang="it"><body style="font-family:Georgia,serif;background:#f7f3eb;padding:24px;color:#333"><div style="max-width:640px;margin:auto;background:#fff;border-radius:12px;padding:24px"><h2 style="margin:0 0 4px 0">Backup settimanale Drive</h2><p style="color:#555;margin:0 0 16px 0">${escapeHtml(input.weekLabel)}</p><table style="width:100%;border-collapse:collapse" cellspacing="0"><thead><tr><th align="left" style="padding:6px 12px;border-bottom:1px solid #ddd">Giorno</th><th align="left" style="padding:6px 12px;border-bottom:1px solid #ddd">Contenuto</th><th align="left" style="padding:6px 12px;border-bottom:1px solid #ddd">Drive</th></tr></thead><tbody>${rows}</tbody></table></div></body></html>`;
}

export function weekLabel(now: Date): string {
  const start = new Date(now);
  start.setDate(start.getDate() - 6);
  const fmt = new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return `${fmt.format(start)} – ${fmt.format(now)}`;
}

export const weeklyBackupDigest = onSchedule(
  {
    schedule: "0 8 * * 1",
    timeZone: "Europe/Rome",
    region: "europe-west1",
    timeoutSeconds: 300,
    memory: "512MiB",
    secrets: [DRIVE_BACKUP_KEY, DRIVE_BACKUP_FOLDER_ID, DIGEST_RECIPIENT],
    ingressSettings: "ALLOW_INTERNAL_ONLY",
  },
  async () => {
    const recipient = DIGEST_RECIPIENT.value();
    if (!recipient) {
      logger.warn("backup.drive.digest.skipped", { reason: "no_recipient" });
      return;
    }
    const rootFolderId = DRIVE_BACKUP_FOLDER_ID.value();
    const client = makeDigestReadClient({
      serviceAccountJson: DRIVE_BACKUP_KEY.value(),
    });
    const folders = await client.listDayFolders(rootFolderId, 7);
    const days: DigestDay[] = [];
    for (const f of folders) {
      const manifest = await client.loadManifest(f.id);
      days.push({
        date: f.name,
        folderId: f.id,
        folderLink: client.folderLink(f.id),
        manifest,
      });
    }
    const label = weekLabel(new Date());
    const html = renderDigestHtml({ weekLabel: label, days });
    const repos = getRepositories();
    await repos.mail.send({
      to: recipient,
      message: {
        subject: `Backup settimanale Drive (${label})`,
        html,
      },
      kind: "drive_backup_digest",
    });
    await repos.audit.record({
      actorUid: "system",
      actorEmail: "scheduled@vet",
      action: "backup.drive.digest.sent",
      targetType: "drive",
      targetId: label,
      details: { dayCount: days.length },
    });
    logger.info("backup.drive.digest.sent", {
      dayCount: days.length,
      weekLabel: label,
    });
  }
);
