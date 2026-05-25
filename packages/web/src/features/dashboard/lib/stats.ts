import type { Attivita } from "@vet/shared";

export interface MonthStats {
  count: number;
  total: number;
  byAzienda: Map<string, { nome: string; total: number; count: number }>;
  byTipo: Map<string, { nome: string; total: number; count: number }>;
}

export function startOfMonthLocal(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

export function endOfMonthLocal(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function statsForRange(
  items: Attivita[],
  from: Date,
  to: Date
): MonthStats {
  const inRange = items.filter(
    (a) => a.data.getTime() >= from.getTime() && a.data.getTime() <= to.getTime()
  );
  const byAzienda = new Map<
    string,
    { nome: string; total: number; count: number }
  >();
  const byTipo = new Map<
    string,
    { nome: string; total: number; count: number }
  >();
  let total = 0;
  for (const a of inRange) {
    total += a.totale;
    const ka = byAzienda.get(a.aziendaId) ?? {
      nome: a.aziendaNome,
      total: 0,
      count: 0,
    };
    ka.total += a.totale;
    ka.count += 1;
    byAzienda.set(a.aziendaId, ka);
    const kt = byTipo.get(a.tipoId) ?? {
      nome: a.tipoNome,
      total: 0,
      count: 0,
    };
    kt.total += a.totale;
    kt.count += 1;
    byTipo.set(a.tipoId, kt);
  }
  return {
    count: inRange.length,
    total: Math.round(total * 100) / 100,
    byAzienda,
    byTipo,
  };
}

export function topEntry<V extends { total: number }>(
  map: Map<string, V>
): { key: string; value: V } | null {
  let best: { key: string; value: V } | null = null;
  for (const [k, v] of map) {
    if (!best || v.total > best.value.total) best = { key: k, value: v };
  }
  return best;
}

export function percentDiff(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export const SHORT_MONTHS = [
  "Gen", "Feb", "Mar", "Apr", "Mag", "Giu",
  "Lug", "Ago", "Set", "Ott", "Nov", "Dic",
];

export function trailingMonths(
  items: Attivita[],
  now: Date,
  months = 12
): { totals: number[]; counts: number[]; labels: string[] } {
  const totals: number[] = [];
  const counts: number[] = [];
  const labels: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(
      now.getFullYear(),
      now.getMonth() - i + 1,
      0,
      23,
      59,
      59,
      999
    );
    let sum = 0;
    let count = 0;
    for (const a of items) {
      if (a.data.getTime() >= start.getTime() && a.data.getTime() <= end.getTime()) {
        sum += a.totale;
        count += 1;
      }
    }
    totals.push(Math.round(sum * 100) / 100);
    counts.push(count);
    labels.push(SHORT_MONTHS[start.getMonth()]!);
  }
  return { totals, counts, labels };
}
