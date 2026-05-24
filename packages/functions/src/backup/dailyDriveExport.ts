import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions/v2";
import { defineSecret } from "firebase-functions/params";
import { google } from "googleapis";
import { Readable } from "node:stream";
import { adminDb } from "../admin/firebaseAdmin.js";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

const DRIVE_BACKUP_KEY = defineSecret("drive-backup-key");
const DRIVE_BACKUP_FOLDER_ID = defineSecret("drive-backup-folder-id");

export const BACKUP_COLLECTIONS = [
  "attivita",
  "aziende",
  "conti",
  "activity_types",
  "users",
  "roles",
  "allowlist",
  "audit",
] as const;

export type BackupCollection = (typeof BACKUP_COLLECTIONS)[number];

export interface CollectionManifestEntry {
  collection: BackupCollection;
  rowCount: number;
  jsonlBytes: number;
  csvBytes: number;
  jsonlFileId: string;
  csvFileId: string;
}

export interface BackupManifest {
  date: string;
  generatedAt: string;
  project: string;
  collections: CollectionManifestEntry[];
  totalRows: number;
  totalBytes: number;
}

export interface DriveClient {
  ensureFolder(name: string, parentId: string): Promise<string>;
  uploadFile(input: {
    name: string;
    parentId: string;
    mimeType: string;
    body: string;
  }): Promise<{ id: string; size: number }>;
}

export function isoDate(now: Date): string {
  return now.toISOString().slice(0, 10);
}

export function serializeDocToJsonValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serializeDocToJsonValue);
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = serializeDocToJsonValue(v);
    }
    return out;
  }
  return value;
}

export function toJsonl(docs: Array<{ id: string; data: unknown }>): string {
  return docs
    .map((d) => {
      const row = { id: d.id, ...(serializeDocToJsonValue(d.data) as Record<string, unknown>) };
      return JSON.stringify(row);
    })
    .join("\n");
}

export function collectCsvColumns(
  docs: Array<{ id: string; data: unknown }>
): string[] {
  const seen = new Set<string>(["id"]);
  for (const d of docs) {
    const obj = serializeDocToJsonValue(d.data);
    if (obj && typeof obj === "object" && !Array.isArray(obj)) {
      for (const key of Object.keys(obj as Record<string, unknown>)) {
        seen.add(key);
      }
    }
  }
  return Array.from(seen);
}

export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str =
    typeof value === "string"
      ? value
      : typeof value === "number" || typeof value === "boolean"
        ? String(value)
        : JSON.stringify(value);
  const needsQuoting = /[",\n\r;]/.test(str);
  if (!needsQuoting) return str;
  return `"${str.replace(/"/g, '""')}"`;
}

export function toCsv(docs: Array<{ id: string; data: unknown }>): string {
  const columns = collectCsvColumns(docs);
  const header = columns.map(escapeCsvCell).join(",");
  if (docs.length === 0) return header;
  const rows = docs.map((d) => {
    const obj = serializeDocToJsonValue(d.data) as Record<string, unknown>;
    const merged: Record<string, unknown> = { id: d.id, ...obj };
    return columns.map((c) => escapeCsvCell(merged[c])).join(",");
  });
  return [header, ...rows].join("\n");
}

export function buildManifest(input: {
  date: string;
  project: string;
  entries: CollectionManifestEntry[];
  generatedAt: Date;
}): BackupManifest {
  const totalRows = input.entries.reduce((s, e) => s + e.rowCount, 0);
  const totalBytes = input.entries.reduce(
    (s, e) => s + e.jsonlBytes + e.csvBytes,
    0
  );
  return {
    date: input.date,
    generatedAt: input.generatedAt.toISOString(),
    project: input.project,
    collections: input.entries,
    totalRows,
    totalBytes,
  };
}

export function byteLength(str: string): number {
  return Buffer.byteLength(str, "utf8");
}

interface DriveClientFactoryInput {
  serviceAccountJson: string;
}

export function makeDriveClient(input: DriveClientFactoryInput): DriveClient {
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
    async ensureFolder(name, parentId) {
      const q = [
        `name = '${name.replace(/'/g, "\\'")}'`,
        `'${parentId}' in parents`,
        "mimeType = 'application/vnd.google-apps.folder'",
        "trashed = false",
      ].join(" and ");
      const list = await drive.files.list({
        q,
        fields: "files(id, name)",
        spaces: "drive",
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });
      const existing = list.data.files?.[0];
      if (existing?.id) return existing.id;
      const created = await drive.files.create({
        requestBody: {
          name,
          mimeType: "application/vnd.google-apps.folder",
          parents: [parentId],
        },
        fields: "id",
        supportsAllDrives: true,
      });
      const id = created.data.id;
      if (!id) throw new Error("drive folder creation returned no id");
      return id;
    },
    async uploadFile({ name, parentId, mimeType, body }) {
      const size = byteLength(body);
      const res = await drive.files.create({
        requestBody: { name, parents: [parentId], mimeType },
        media: { mimeType, body: Readable.from([body]) },
        fields: "id, size",
        supportsAllDrives: true,
      });
      const id = res.data.id;
      if (!id) throw new Error(`drive upload returned no id for ${name}`);
      return { id, size };
    },
  };
}

export interface RunExportInput {
  db: typeof adminDb;
  drive: DriveClient;
  rootFolderId: string;
  date: string;
  project: string;
  generatedAt: Date;
  collections?: readonly BackupCollection[];
}

export async function runDriveExport(input: RunExportInput): Promise<BackupManifest> {
  const collections = input.collections ?? BACKUP_COLLECTIONS;
  const dayFolderId = await input.drive.ensureFolder(input.date, input.rootFolderId);
  const entries: CollectionManifestEntry[] = [];
  for (const collection of collections) {
    const snap = await input.db.collection(collection).get();
    const docs = snap.docs.map((d) => ({ id: d.id, data: d.data() }));
    const jsonl = toJsonl(docs);
    const csv = toCsv(docs);
    const jsonlBytes = byteLength(jsonl);
    const csvBytes = byteLength(csv);
    const stamp = input.generatedAt.toISOString().replace(/[:.]/g, "-");
    const jsonlRes = await input.drive.uploadFile({
      name: `${collection}-${stamp}.jsonl`,
      parentId: dayFolderId,
      mimeType: "application/x-ndjson",
      body: jsonl,
    });
    const csvRes = await input.drive.uploadFile({
      name: `${collection}-${stamp}.csv`,
      parentId: dayFolderId,
      mimeType: "text/csv",
      body: csv,
    });
    entries.push({
      collection,
      rowCount: docs.length,
      jsonlBytes,
      csvBytes,
      jsonlFileId: jsonlRes.id,
      csvFileId: csvRes.id,
    });
  }
  const manifest = buildManifest({
    date: input.date,
    project: input.project,
    entries,
    generatedAt: input.generatedAt,
  });
  await input.drive.uploadFile({
    name: `manifest-${input.generatedAt.toISOString().replace(/[:.]/g, "-")}.json`,
    parentId: dayFolderId,
    mimeType: "application/json",
    body: JSON.stringify(manifest, null, 2),
  });
  return manifest;
}

export const dailyDriveExport = onSchedule(
  {
    schedule: "0 2 * * *",
    timeZone: "Europe/Rome",
    region: "europe-west1",
    timeoutSeconds: 540,
    memory: "1GiB",
    secrets: [DRIVE_BACKUP_KEY, DRIVE_BACKUP_FOLDER_ID],
  },
  async () => {
    const project = process.env.GCLOUD_PROJECT ?? "vet-marinoni";
    const generatedAt = new Date();
    const date = isoDate(generatedAt);
    const rootFolderId = DRIVE_BACKUP_FOLDER_ID.value();
    try {
      const drive = makeDriveClient({ serviceAccountJson: DRIVE_BACKUP_KEY.value() });
      const manifest = await runDriveExport({
        db: adminDb,
        drive,
        rootFolderId,
        date,
        project,
        generatedAt,
      });
      logger.info("backup.drive.export.success", {
        date,
        totalRows: manifest.totalRows,
        totalBytes: manifest.totalBytes,
        collections: manifest.collections.map((c) => ({
          collection: c.collection,
          rowCount: c.rowCount,
          bytes: c.jsonlBytes + c.csvBytes,
        })),
      });
      await adminDb.collection("audit").add({
        at: FieldValue.serverTimestamp(),
        actorUid: "system",
        actorEmail: "scheduled@vet",
        action: "backup.drive.export.success",
        targetType: "drive",
        targetId: date,
        details: {
          totalRows: manifest.totalRows,
          totalBytes: manifest.totalBytes,
          collectionCount: manifest.collections.length,
        },
      });
    } catch (err) {
      logger.error("backup.drive.export.failure", {
        date,
        message: err instanceof Error ? err.message : String(err),
      });
      await adminDb.collection("audit").add({
        at: FieldValue.serverTimestamp(),
        actorUid: "system",
        actorEmail: "scheduled@vet",
        action: "backup.drive.export.failure",
        targetType: "drive",
        targetId: date,
        details: { reason: "export_failed" },
      });
      throw err;
    }
  }
);
