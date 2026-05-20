import type { Attivita } from "@vet/shared";
import { dateInputValue } from "./format";

const dayLabelFormatter = new Intl.DateTimeFormat("it-IT", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export interface Totals {
  count: number;
  totale: number;
  aziende: number;
  vets: number;
}

export function computeTotals(items: Attivita[]): Totals {
  let totale = 0;
  const aziende = new Set<string>();
  const vets = new Set<string>();
  for (const a of items) {
    totale += a.totale;
    aziende.add(a.aziendaId);
    vets.add(a.ownerUid);
  }
  return {
    count: items.length,
    totale: Math.round(totale * 100) / 100,
    aziende: aziende.size,
    vets: vets.size,
  };
}

export type GroupKey = "none" | "azienda" | "giorno" | "vet";

export interface Group {
  key: string;
  label: string;
  items: Attivita[];
  totale: number;
}

export function groupAttivita(items: Attivita[], by: GroupKey): Group[] {
  if (by === "none") {
    return [
      {
        key: "all",
        label: "",
        items,
        totale: items.reduce((s, a) => s + a.totale, 0),
      },
    ];
  }
  const map = new Map<string, Group>();
  for (const a of items) {
    const { key, label } = groupKeyFor(a, by);
    const existing = map.get(key);
    if (existing) {
      existing.items.push(a);
      existing.totale += a.totale;
    } else {
      map.set(key, { key, label, items: [a], totale: a.totale });
    }
  }
  return [...map.values()].map((g) => ({
    ...g,
    totale: Math.round(g.totale * 100) / 100,
  }));
}

function groupKeyFor(a: Attivita, by: GroupKey): { key: string; label: string } {
  if (by === "azienda") return { key: a.aziendaId, label: a.aziendaNome };
  if (by === "vet") return { key: a.ownerUid, label: a.ownerName };
  return { key: dateInputValue(a.data), label: dayLabelFormatter.format(a.data) };
}
