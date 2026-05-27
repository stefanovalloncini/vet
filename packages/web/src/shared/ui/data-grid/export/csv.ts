import type { Column, ExportCell } from "../types";

/**
 * Convert a numeric value to the Italian decimal representation (comma as
 * decimal separator). Non-finite values become an empty string.
 */
export function formatNumberItalian(value: number): string {
  if (!Number.isFinite(value)) return "";
  return value.toString().replace(".", ",");
}

/**
 * Quote a single CSV cell with formula-injection protection and proper
 * escaping for semicolon-delimited Italian CSV.
 */
export function quoteCsvCell(raw: string): string {
  const dangerous = /^[\s=+\-@]/.test(raw);
  const cell = dangerous ? "'" + raw : raw;
  if (/[";\r\n]/.test(cell)) {
    return `"${cell.replace(/"/g, '""')}"`;
  }
  return cell;
}

function defaultExport<T>(col: Column<T>, row: T): ExportCell {
  if (col.export) return col.export(row);
  const v = col.accessor(row);
  if (v == null) return { text: "" };
  if (typeof v === "number") {
    return { text: formatNumberItalian(v), numeric: v };
  }
  if (v instanceof Date) {
    // ISO-like Italian dd/MM/yyyy
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, "0");
    const d = String(v.getDate()).padStart(2, "0");
    return { text: `${d}/${m}/${y}` };
  }
  if (typeof v === "boolean") {
    return { text: v ? "true" : "false" };
  }
  return { text: String(v) };
}

/**
 * Build a CSV string from columns + rows. Output is UTF-8 BOM prefixed,
 * semicolon delimited, CRLF terminated, with Italian number formatting and
 * formula-injection guard.
 */
export function toCsv<T>(
  columns: ReadonlyArray<Column<T>>,
  rows: ReadonlyArray<T>
): string {
  const header = columns.map((c) => quoteCsvCell(c.header)).join(";");
  const body = rows.map((row) =>
    columns
      .map((col) => {
        const exp = defaultExport(col, row);
        return quoteCsvCell(exp.text);
      })
      .join(";")
  );
  const lines = [header, ...body];
  return "﻿" + lines.join("\r\n") + "\r\n";
}

/**
 * Trigger a browser download for the supplied CSV content.
 */
export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
