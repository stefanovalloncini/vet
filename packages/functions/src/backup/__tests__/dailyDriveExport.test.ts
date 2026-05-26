import { describe, expect, it, vi } from "vitest";
import { Timestamp } from "firebase-admin/firestore";
import {
  BACKUP_COLLECTIONS,
  buildManifest,
  byteLength,
  collectCsvColumns,
  escapeCsvCell,
  isoDate,
  runDriveExport,
  serializeDocToJsonValue,
  toCsv,
  toJsonl,
  type DriveClient,
} from "../dailyDriveExport.js";

describe("isoDate", () => {
  it("formats yyyy-mm-dd from a Date", () => {
    expect(isoDate(new Date("2026-05-24T03:14:00.000Z"))).toBe("2026-05-24");
  });
});

describe("serializeDocToJsonValue", () => {
  it("converts Timestamp to ISO string", () => {
    const ts = Timestamp.fromDate(new Date("2026-01-02T10:00:00.000Z"));
    expect(serializeDocToJsonValue(ts)).toBe("2026-01-02T10:00:00.000Z");
  });

  it("recursively serializes nested objects with Timestamp", () => {
    const ts = Timestamp.fromDate(new Date("2026-01-02T10:00:00.000Z"));
    const out = serializeDocToJsonValue({
      nested: { at: ts, tags: ["a", "b"] },
    });
    expect(out).toEqual({
      nested: { at: "2026-01-02T10:00:00.000Z", tags: ["a", "b"] },
    });
  });

  it("passes through primitives and null", () => {
    expect(serializeDocToJsonValue(42)).toBe(42);
    expect(serializeDocToJsonValue("x")).toBe("x");
    expect(serializeDocToJsonValue(null)).toBe(null);
    expect(serializeDocToJsonValue(undefined)).toBe(undefined);
  });
});

describe("toJsonl", () => {
  it("emits one JSON object per line and round-trips through parse", () => {
    const docs = [
      { id: "a", data: { nome: "Alpha", n: 1 } },
      { id: "b", data: { nome: "Beta", n: 2 } },
    ];
    const out = toJsonl(docs);
    const lines = out.split("\n");
    expect(lines).toHaveLength(2);
    const parsed = lines.map((l) => JSON.parse(l) as Record<string, unknown>);
    expect(parsed[0]).toEqual({ id: "a", nome: "Alpha", n: 1 });
    expect(parsed[1]).toEqual({ id: "b", nome: "Beta", n: 2 });
  });

  it("converts Timestamp values when round-tripping", () => {
    const ts = Timestamp.fromDate(new Date("2026-05-01T08:00:00.000Z"));
    const out = toJsonl([{ id: "x", data: { at: ts } }]);
    const parsed = JSON.parse(out) as { id: string; at: string };
    expect(parsed.at).toBe("2026-05-01T08:00:00.000Z");
  });

  it("returns empty string for no docs", () => {
    expect(toJsonl([])).toBe("");
  });
});

describe("escapeCsvCell", () => {
  it("returns plain text untouched", () => {
    expect(escapeCsvCell("hello")).toBe("hello");
  });

  it("escapes embedded quotes by doubling", () => {
    expect(escapeCsvCell('he said "hi"')).toBe('"he said ""hi"""');
  });

  it("quotes cells containing commas", () => {
    expect(escapeCsvCell("a, b")).toBe('"a, b"');
  });

  it("quotes cells containing newlines", () => {
    expect(escapeCsvCell("line1\nline2")).toBe('"line1\nline2"');
  });

  it("quotes cells containing semicolons", () => {
    expect(escapeCsvCell("a; b")).toBe('"a; b"');
  });

  it("renders numbers and booleans as strings", () => {
    expect(escapeCsvCell(42)).toBe("42");
    expect(escapeCsvCell(true)).toBe("true");
  });

  it("returns empty string for null and undefined", () => {
    expect(escapeCsvCell(null)).toBe("");
    expect(escapeCsvCell(undefined)).toBe("");
  });

  it("JSON-stringifies objects", () => {
    expect(escapeCsvCell({ a: 1 })).toBe('"{""a"":1}"');
  });

  it("neutralizes leading formula characters", () => {
    expect(escapeCsvCell("=cmd|'/c calc'!A1")).toBe("'=cmd|'/c calc'!A1");
    expect(escapeCsvCell("+1+1")).toBe("'+1+1");
    expect(escapeCsvCell("-DDE()")).toBe("'-DDE()");
    expect(escapeCsvCell("@SUM()")).toBe("'@SUM()");
  });

  it("neutralizes whitespace-then-formula bypass", () => {
    expect(escapeCsvCell(" =cmd")).toBe("' =cmd");
    expect(escapeCsvCell("\t=cmd")).toBe("'\t=cmd");
    expect(escapeCsvCell("   +HYPERLINK")).toBe("'   +HYPERLINK");
  });

  it("does not double-neutralize benign leading digits", () => {
    expect(escapeCsvCell("42")).toBe("42");
    expect(escapeCsvCell("Mario Rossi")).toBe("Mario Rossi");
  });
});

describe("collectCsvColumns", () => {
  it("collects union of keys across docs with id first", () => {
    const cols = collectCsvColumns([
      { id: "1", data: { a: 1, b: 2 } },
      { id: "2", data: { b: 3, c: 4 } },
    ]);
    expect(cols[0]).toBe("id");
    expect(new Set(cols)).toEqual(new Set(["id", "a", "b", "c"]));
  });

  it("returns just id when no docs", () => {
    expect(collectCsvColumns([])).toEqual(["id"]);
  });
});

describe("toCsv", () => {
  it("emits header + one row per doc", () => {
    const csv = toCsv([
      { id: "a", data: { nome: "Alpha", n: 1 } },
      { id: "b", data: { nome: "Beta", n: 2 } },
    ]);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe("id,nome,n");
    expect(lines[1]).toBe("a,Alpha,1");
    expect(lines[2]).toBe("b,Beta,2");
  });

  it("escapes special characters in row values", () => {
    const csv = toCsv([
      { id: "a", data: { nome: 'Alpha "the great"', note: "line1\nline2" } },
    ]);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("id,nome,note");
    expect(lines[1]?.startsWith('a,"Alpha ""the great""",')).toBe(true);
  });

  it("handles missing fields as empty cells", () => {
    const csv = toCsv([
      { id: "a", data: { x: 1 } },
      { id: "b", data: { y: 2 } },
    ]);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("id,x,y");
    expect(lines[1]).toBe("a,1,");
    expect(lines[2]).toBe("b,,2");
  });

  it("returns header only for empty input", () => {
    expect(toCsv([])).toBe("id");
  });
});

describe("buildManifest", () => {
  it("is well-formed and aggregates totals", () => {
    const manifest = buildManifest({
      date: "2026-05-24",
      project: "vet-marinoni",
      generatedAt: new Date("2026-05-24T02:00:00.000Z"),
      entries: [
        {
          collection: "attivita",
          rowCount: 10,
          jsonlBytes: 100,
          csvBytes: 50,
          jsonlFileId: "f1",
          csvFileId: "f2",
        },
        {
          collection: "aziende",
          rowCount: 5,
          jsonlBytes: 80,
          csvBytes: 40,
          jsonlFileId: "f3",
          csvFileId: "f4",
        },
      ],
    });
    expect(manifest.date).toBe("2026-05-24");
    expect(manifest.project).toBe("vet-marinoni");
    expect(manifest.generatedAt).toBe("2026-05-24T02:00:00.000Z");
    expect(manifest.totalRows).toBe(15);
    expect(manifest.totalBytes).toBe(270);
    expect(manifest.collections).toHaveLength(2);
  });
});

describe("byteLength", () => {
  it("counts UTF-8 bytes including multi-byte characters", () => {
    expect(byteLength("abc")).toBe(3);
    expect(byteLength("àèì")).toBe(6);
  });
});

describe("runDriveExport", () => {
  function fakeDb(collections: Record<string, Array<{ id: string; data: unknown }>>) {
    return {
      collection: (name: string) => ({
        async get() {
          const docs = collections[name] ?? [];
          return {
            docs: docs.map((d) => ({ id: d.id, data: () => d.data })),
          };
        },
      }),
    } as unknown as Parameters<typeof runDriveExport>[0]["db"];
  }

  function fakeDrive(): { client: DriveClient; uploads: Array<{ name: string; body: string; parentId: string }>; folders: Map<string, string> } {
    const uploads: Array<{ name: string; body: string; parentId: string }> = [];
    const folders = new Map<string, string>();
    let counter = 0;
    const client: DriveClient = {
      async ensureFolder(name, parentId) {
        const key = `${parentId}/${name}`;
        const existing = folders.get(key);
        if (existing) return existing;
        const id = `folder-${++counter}`;
        folders.set(key, id);
        return id;
      },
      async uploadFile({ name, parentId, body }) {
        uploads.push({ name, parentId, body });
        return { id: `file-${++counter}`, size: Buffer.byteLength(body, "utf8") };
      },
    };
    return { client, uploads, folders };
  }

  it("walks every collection and writes jsonl + csv + manifest", async () => {
    const db = fakeDb({
      attivita: [{ id: "a1", data: { nome: "x", n: 1 } }],
      aziende: [{ id: "z1", data: { ragioneSociale: "Acme srl" } }],
      conti: [],
      activity_types: [{ id: "t1", data: { label: "Visita" } }],
      users: [],
      roles: [],
      allowlist: [],
      audit: [],
    });
    const { client, uploads } = fakeDrive();
    const manifest = await runDriveExport({
      db,
      drive: client,
      rootFolderId: "root",
      date: "2026-05-24",
      project: "vet-test",
      generatedAt: new Date("2026-05-24T02:00:00.000Z"),
    });
    expect(manifest.collections).toHaveLength(BACKUP_COLLECTIONS.length);
    expect(manifest.collections.find((c) => c.collection === "attivita")?.rowCount).toBe(1);
    expect(manifest.collections.find((c) => c.collection === "conti")?.rowCount).toBe(0);
    const names = uploads.map((u) => u.name);
    expect(names).toContain("attivita-2026-05-24T02-00-00-000Z.jsonl");
    expect(names).toContain("attivita-2026-05-24T02-00-00-000Z.csv");
    expect(names.some((n) => n.startsWith("manifest-"))).toBe(true);
    const manifestUpload = uploads.find((u) => u.name.startsWith("manifest-"));
    expect(manifestUpload).toBeDefined();
    const parsed = JSON.parse(manifestUpload!.body) as { totalRows: number };
    expect(parsed.totalRows).toBe(3);
  });

  it("skips collections not in the override list", async () => {
    const db = fakeDb({
      attivita: [{ id: "a1", data: { n: 1 } }],
      aziende: [{ id: "z1", data: { n: 2 } }],
    });
    const { client, uploads } = fakeDrive();
    const manifest = await runDriveExport({
      db,
      drive: client,
      rootFolderId: "root",
      date: "2026-05-24",
      project: "vet-test",
      generatedAt: new Date("2026-05-24T02:00:00.000Z"),
      collections: ["attivita"],
    });
    expect(manifest.collections.map((c) => c.collection)).toEqual(["attivita"]);
    expect(uploads.filter((u) => u.name.startsWith("aziende-"))).toHaveLength(0);
  });

  it("propagates upload failures", async () => {
    const db = fakeDb({ attivita: [{ id: "a", data: { n: 1 } }] });
    const client: DriveClient = {
      async ensureFolder() {
        return "folder";
      },
      uploadFile: vi.fn().mockRejectedValue(new Error("network")),
    };
    await expect(
      runDriveExport({
        db,
        drive: client,
        rootFolderId: "root",
        date: "2026-05-24",
        project: "vet-test",
        generatedAt: new Date(),
        collections: ["attivita"],
      })
    ).rejects.toThrow("network");
  });
});
