import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions/v2";
import { defineSecret } from "firebase-functions/params";
import { google, type drive_v3 } from "googleapis";
import { adminDb } from "../admin/firebaseAdmin.js";
import { FieldValue } from "firebase-admin/firestore";

const DRIVE_BACKUP_KEY = defineSecret("drive-backup-key");
const DRIVE_BACKUP_FOLDER_ID = defineSecret("drive-backup-folder-id");

export const RETENTION_COUNT = 7;
export const DATE_FOLDER_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface DatedFolder {
  id: string;
  name: string;
}

export interface CleanupDriveClient {
  listDatedFolders(rootFolderId: string): Promise<DatedFolder[]>;
  deleteFolder(folderId: string): Promise<void>;
}

export interface CleanupResult {
  deletedCount: number;
  retainedCount: number;
  retainedDates: string[];
  deletedDates: string[];
}

export function isDatedFolderName(name: string): boolean {
  return DATE_FOLDER_PATTERN.test(name);
}

export function partitionForRetention(
  folders: DatedFolder[],
  retentionCount: number
): { retained: DatedFolder[]; toDelete: DatedFolder[] } {
  const dated = folders.filter((f) => isDatedFolderName(f.name));
  const sorted = [...dated].sort((a, b) => (a.name < b.name ? 1 : a.name > b.name ? -1 : 0));
  const retained = sorted.slice(0, retentionCount);
  const toDelete = sorted.slice(retentionCount);
  return { retained, toDelete };
}

export function makeCleanupDriveClient(input: {
  serviceAccountJson: string;
}): CleanupDriveClient {
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
    async listDatedFolders(rootFolderId) {
      const q = [
        `'${rootFolderId}' in parents`,
        "mimeType = 'application/vnd.google-apps.folder'",
        "trashed = false",
      ].join(" and ");
      const all: DatedFolder[] = [];
      let pageToken: string | null = null;
      do {
        const params: drive_v3.Params$Resource$Files$List = {
          q,
          orderBy: "name desc",
          pageSize: 100,
          fields: "nextPageToken, files(id, name)",
          spaces: "drive",
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
        };
        if (pageToken) params.pageToken = pageToken;
        const res = await drive.files.list(params);
        const items = res.data.files ?? [];
        for (const f of items) {
          if (typeof f.id === "string" && typeof f.name === "string") {
            all.push({ id: f.id, name: f.name });
          }
        }
        pageToken = res.data.nextPageToken ?? null;
      } while (pageToken);
      return all;
    },
    async deleteFolder(folderId) {
      await drive.files.delete({
        fileId: folderId,
        supportsAllDrives: true,
      } satisfies drive_v3.Params$Resource$Files$Delete);
    },
  };
}

export interface RunCleanupInput {
  drive: CleanupDriveClient;
  rootFolderId: string;
  retentionCount?: number;
}

export async function runCleanup(input: RunCleanupInput): Promise<CleanupResult> {
  const retentionCount = input.retentionCount ?? RETENTION_COUNT;
  const folders = await input.drive.listDatedFolders(input.rootFolderId);
  const { retained, toDelete } = partitionForRetention(folders, retentionCount);
  for (const folder of toDelete) {
    await input.drive.deleteFolder(folder.id);
  }
  return {
    deletedCount: toDelete.length,
    retainedCount: retained.length,
    retainedDates: retained.map((f) => f.name),
    deletedDates: toDelete.map((f) => f.name),
  };
}

export const cleanupOldDriveBackups = onSchedule(
  {
    schedule: "0 3 * * *",
    timeZone: "Europe/Rome",
    region: "europe-west1",
    timeoutSeconds: 300,
    memory: "512MiB",
    secrets: [DRIVE_BACKUP_KEY, DRIVE_BACKUP_FOLDER_ID],
  },
  async () => {
    const rootFolderId = DRIVE_BACKUP_FOLDER_ID.value();
    const runAt = new Date().toISOString().slice(0, 10);
    try {
      const drive = makeCleanupDriveClient({
        serviceAccountJson: DRIVE_BACKUP_KEY.value(),
      });
      const result = await runCleanup({ drive, rootFolderId });
      logger.info("backup.drive.cleanup.success", {
        deletedCount: result.deletedCount,
        retainedCount: result.retainedCount,
        retainedDates: result.retainedDates,
      });
      await adminDb.collection("audit").add({
        at: FieldValue.serverTimestamp(),
        actorUid: "system",
        actorEmail: "scheduled@vet",
        action: "backup.drive.cleanup.success",
        targetType: "drive",
        targetId: runAt,
        details: {
          deletedCount: result.deletedCount,
          retainedCount: result.retainedCount,
          deletedDates: result.deletedDates,
        },
      });
    } catch (err) {
      logger.error("backup.drive.cleanup.failure", {
        runAt,
        message: err instanceof Error ? err.message : String(err),
      });
      await adminDb.collection("audit").add({
        at: FieldValue.serverTimestamp(),
        actorUid: "system",
        actorEmail: "scheduled@vet",
        action: "backup.drive.cleanup.failure",
        targetType: "drive",
        targetId: runAt,
        details: { reason: "cleanup_failed" },
      });
      throw err;
    }
  }
);
