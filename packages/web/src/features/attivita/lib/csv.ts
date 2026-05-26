import { slugify, type Attivita } from "@vet/shared";

const HEADER = [
  "Data",
  "Azienda",
  "Tipo",
  "Modalità",
  "Tariffa",
  "Ore",
  "Quantità",
  "Totale",
  "Veterinario",
  "Note",
];

function modalitaLabel(a: Attivita): string {
  if (a.oraria) return "oraria";
  if (a.adElemento) return "ad elemento";
  return "fissa";
}

export function toCsvItalian(items: Attivita[]): string {
  const rows = items.map((a) => [
    formatDataIso(a.data),
    a.aziendaNome,
    a.tipoNome,
    modalitaLabel(a),
    formatEuroIt(a.tariffa),
    a.ore !== undefined ? formatNumberIt(a.ore) : "",
    a.elementi !== undefined ? String(a.elementi) : "",
    formatEuroIt(a.totale),
    a.ownerName,
    a.note ?? "",
  ]);
  const lines = [HEADER, ...rows].map((cells) =>
    cells.map(quoteCell).join(";")
  );
  return "﻿" + lines.join("\r\n") + "\r\n";
}

function quoteCell(s: string): string {
  const dangerous = /^[\s=+\-@]/.test(s);
  const cell = dangerous ? "'" + s : s;
  if (/[";\r\n]/.test(cell)) {
    return `"${cell.replace(/"/g, '""')}"`;
  }
  return cell;
}

function formatDataIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${day}/${m}/${y}`;
}

function formatNumberIt(n: number): string {
  return n.toFixed(2).replace(".", ",");
}

function formatEuroIt(n: number): string {
  return n.toFixed(2).replace(".", ",");
}

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

export function csvFilename(opts: {
  aziendaNome?: string;
  from?: Date;
  to?: Date;
}): string {
  const parts: string[] = ["attivita"];
  if (opts.aziendaNome) parts.push(slugify(opts.aziendaNome));
  if (opts.from) parts.push(formatDataCompact(opts.from));
  if (opts.to) parts.push(formatDataCompact(opts.to));
  return parts.join("_") + ".csv";
}

function formatDataCompact(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}
