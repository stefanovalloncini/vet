import type { Column } from "../types";

export interface PdfExportOptions {
  title?: string;
  filename?: string;
}

interface AutoTableModule {
  default: (doc: unknown, options: unknown) => void;
}

/**
 * Build an autoTable-compatible config object from the columns + rows.
 * Pure: does not load jspdf. Exposed for testing.
 */
export function buildAutoTableConfig<T>(
  columns: ReadonlyArray<Column<T>>,
  rows: ReadonlyArray<T>,
  opts: { startY?: number } = {}
): {
  head: string[][];
  body: string[][];
  startY?: number;
} {
  const head = [columns.map((c) => c.header)];
  const body = rows.map((row) =>
    columns.map((col) => {
      if (col.export) return col.export(row).text;
      const v = col.accessor(row);
      if (v == null) return "";
      if (v instanceof Date) {
        const y = v.getFullYear();
        const m = String(v.getMonth() + 1).padStart(2, "0");
        const d = String(v.getDate()).padStart(2, "0");
        return `${d}/${m}/${y}`;
      }
      if (typeof v === "number") {
        if (!Number.isFinite(v)) return "";
        return v.toString().replace(".", ",");
      }
      if (typeof v === "boolean") return v ? "true" : "false";
      return String(v);
    })
  );
  const config: { head: string[][]; body: string[][]; startY?: number } = {
    head,
    body,
  };
  if (opts.startY !== undefined) config.startY = opts.startY;
  return config;
}

/**
 * Export the supplied columns + rows as a PDF document using jspdf and
 * jspdf-autotable. Both libraries are lazy-imported here to keep them out
 * of the synchronous bundle graph.
 */
export async function exportToPdf<T>(
  columns: ReadonlyArray<Column<T>>,
  rows: ReadonlyArray<T>,
  opts: PdfExportOptions = {}
): Promise<void> {
  const jsPdfMod = await import("jspdf");
  const autoTableMod = (await import("jspdf-autotable")) as unknown as AutoTableModule;

  const JsPDFCtor = (jsPdfMod as { jsPDF?: unknown; default?: unknown }).jsPDF
    ?? (jsPdfMod as { default?: unknown }).default;
  if (typeof JsPDFCtor !== "function") {
    throw new Error("jspdf default export is not a constructor");
  }
  const Ctor = JsPDFCtor as new () => { save: (filename: string) => void; text: (text: string, x: number, y: number) => void };
  const doc = new Ctor();

  let startY: number | undefined;
  if (opts.title) {
    doc.text(opts.title, 14, 16);
    startY = 22;
  }

  const config = buildAutoTableConfig(columns, rows, startY !== undefined ? { startY } : {});
  autoTableMod.default(doc, config);

  doc.save(opts.filename ?? "export.pdf");
}
