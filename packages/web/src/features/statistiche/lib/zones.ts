import type { Azienda } from "@vet/shared";

const COMUNE_RE = /(?:^|,\s*)([\p{L}'\s]{2,40})\s*(?:\(([A-Za-z]{2})\))?\s*$/u;

export function extractZone(a: Azienda): string {
  if (!a.indirizzo) return "—";
  const match = COMUNE_RE.exec(a.indirizzo.trim());
  if (match && match[1]) {
    return match[1].trim();
  }
  const parts = a.indirizzo.split(",").map((s) => s.trim()).filter(Boolean);
  return parts[parts.length - 1] ?? "—";
}

export interface Zone {
  name: string;
  aziende: Azienda[];
}

export function groupByZone(aziende: Azienda[]): Zone[] {
  const map = new Map<string, Azienda[]>();
  for (const a of aziende) {
    const z = extractZone(a);
    const arr = map.get(z) ?? [];
    arr.push(a);
    map.set(z, arr);
  }
  return [...map.entries()]
    .map(([name, list]) => ({ name, aziende: list }))
    .sort((a, b) => b.aziende.length - a.aziende.length);
}
