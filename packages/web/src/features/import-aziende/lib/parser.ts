import { aziendaInputSchema, type AziendaInput } from "@vet/shared";

export interface ParsedRow {
  line: number;
  raw: string;
  ok: boolean;
  input?: AziendaInput;
  error?: string;
}

const HEADER_ALIASES: Record<string, string> = {
  nome: "nome",
  ragionesociale: "nome",
  cliente: "nome",
  azienda: "nome",
  indirizzo: "indirizzo",
  via: "indirizzo",
  telefono: "telefono",
  tel: "telefono",
  email: "emailFatturazione",
  piva: "piva",
  partitaiva: "piva",
  "p.iva": "piva",
  tipo: "tipoAllevamento",
  tipoallevamento: "tipoAllevamento",
  allevamento: "tipoAllevamento",
  capi: "numeroCapi",
  numerocapi: "numeroCapi",
  note: "note",
};

export function parseAziendeCsv(text: string): ParsedRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const firstCells = splitCsvLine(lines[0]!);
  const looksLikeHeader = firstCells.some((c) =>
    HEADER_ALIASES[normalizeKey(c)] !== undefined
  );
  const headers = looksLikeHeader
    ? firstCells.map((c) => HEADER_ALIASES[normalizeKey(c)] ?? null)
    : ["nome", "indirizzo", "telefono", "piva", "tipoAllevamento", "numeroCapi"];
  const startIdx = looksLikeHeader ? 1 : 0;

  const out: ParsedRow[] = [];
  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i]!;
    const cells = splitCsvLine(line);
    const candidate: Record<string, unknown> = {};
    cells.forEach((cell, idx) => {
      const key = headers[idx];
      if (!key || !cell) return;
      if (key === "numeroCapi") {
        const n = Number(cell);
        if (Number.isFinite(n)) candidate[key] = Math.floor(n);
      } else {
        candidate[key] = cell;
      }
    });
    const row: ParsedRow = { line: i + 1, raw: line, ok: false };
    if (!candidate["nome"]) {
      row.error = "Nome mancante";
      out.push(row);
      continue;
    }
    const parsed = aziendaInputSchema.safeParse(candidate);
    if (parsed.success) {
      row.ok = true;
      row.input = parsed.data;
    } else {
      row.error = parsed.error.issues[0]?.message ?? "Riga non valida";
    }
    out.push(row);
  }
  return out;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ";" || c === ",") {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur.trim());
  return out;
}

function normalizeKey(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "");
}
