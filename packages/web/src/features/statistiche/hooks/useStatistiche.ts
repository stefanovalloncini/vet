import { useMemo } from "react";
import { useAttivita } from "../../attivita/hooks/useAttivita";
import { useAziende } from "../../aziende/hooks/useAziende";
import { SHORT_MONTHS_IT as SHORT_MONTHS } from "../../../shared/i18n/months";
import type { Attivita, Azienda } from "@vet/shared";

export type StatistichePeriodo = "12m" | "ytd" | "all";

const EMPTY_AZIENDE: Azienda[] = [];

interface AttivitaFilter {
  from?: Date;
  to?: Date;
}

interface SimpleSlice {
  label: string;
  value: number;
}

interface ClientSlice extends SimpleSlice {
  count: number;
}

interface StackedSegment {
  key: string;
  label: string;
  value: number;
}

interface StackedMonth {
  label: string;
  total: number;
  segments: StackedSegment[];
}

interface FunnelStage {
  label: string;
  value: number;
  hint?: string;
}

interface MonthlyComparison {
  thisYear: number[];
  lastYear: number[];
}

export interface StatisticheData {
  loading: boolean;
  items: Attivita[];
  aziende: Azienda[];
  byTipo: SimpleSlice[];
  topClients: ClientSlice[];
  monthlyComparison: MonthlyComparison;
  stackedMonths: StackedMonth[];
  funnel: FunnelStage[];
  totalRange: number;
  totalLastYear: number;
  yoyDiff: number | null;
}

function filtersForRange(range: StatistichePeriodo, now: Date): AttivitaFilter {
  if (range === "ytd") {
    return { from: new Date(now.getFullYear(), 0, 1), to: now };
  }
  if (range === "12m") {
    return {
      from: new Date(now.getFullYear() - 1, now.getMonth() + 1, 1),
      to: now,
    };
  }
  return {};
}

function byTipoSlices(items: ReadonlyArray<Attivita>): SimpleSlice[] {
  const map = new Map<string, SimpleSlice>();
  for (const a of items) {
    const cur = map.get(a.tipoId) ?? { label: a.tipoNome, value: 0 };
    cur.value += a.totale;
    map.set(a.tipoId, cur);
  }
  return [...map.values()].sort((a, b) => b.value - a.value).slice(0, 8);
}

function topClientsSlices(items: ReadonlyArray<Attivita>): ClientSlice[] {
  const map = new Map<string, ClientSlice>();
  for (const a of items) {
    const cur = map.get(a.aziendaId) ?? {
      label: a.aziendaNome,
      value: 0,
      count: 0,
    };
    cur.value += a.totale;
    cur.count += 1;
    map.set(a.aziendaId, cur);
  }
  return [...map.values()].sort((a, b) => b.value - a.value).slice(0, 5);
}

function monthlyComparisonOf(
  items: ReadonlyArray<Attivita>,
  lastYearItems: ReadonlyArray<Attivita>,
  now: Date
): MonthlyComparison {
  const thisYear = new Array<number>(12).fill(0);
  const lastYear = new Array<number>(12).fill(0);
  for (const a of items) {
    if (a.data.getFullYear() === now.getFullYear()) {
      thisYear[a.data.getMonth()] = (thisYear[a.data.getMonth()] ?? 0) + a.totale;
    }
  }
  for (const a of lastYearItems) {
    lastYear[a.data.getMonth()] = (lastYear[a.data.getMonth()] ?? 0) + a.totale;
  }
  return { thisYear, lastYear };
}

function stackedMonthsOf(
  items: ReadonlyArray<Attivita>,
  now: Date
): StackedMonth[] {
  const months: Array<{
    label: string;
    segments: Map<string, SimpleSlice>;
    total: number;
  }> = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: SHORT_MONTHS[d.getMonth()]!,
      segments: new Map(),
      total: 0,
    });
  }
  const cutoffStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  for (const a of items) {
    if (a.data < cutoffStart) continue;
    const idx =
      (a.data.getFullYear() - cutoffStart.getFullYear()) * 12 +
      (a.data.getMonth() - cutoffStart.getMonth());
    const bucket = months[idx];
    if (!bucket) continue;
    const cur = bucket.segments.get(a.tipoId) ?? {
      label: a.tipoNome,
      value: 0,
    };
    cur.value += a.totale;
    bucket.segments.set(a.tipoId, cur);
    bucket.total += a.totale;
  }
  return months.map((m) => ({
    label: m.label,
    total: m.total,
    segments: [...m.segments.entries()].map(([key, v]) => ({
      key,
      label: v.label,
      value: v.value,
    })),
  }));
}

function funnelOf(
  items: ReadonlyArray<Attivita>,
  aziende: ReadonlyArray<Azienda>
): FunnelStage[] {
  let invoicedCount = 0;
  const aziendaById = new Map(aziende.map((a) => [a.id, a]));
  for (const a of items) {
    const az = aziendaById.get(a.aziendaId);
    if (az?.cadenzaFatturazione) invoicedCount++;
  }
  return [
    { label: "Visite registrate", value: items.length },
    {
      label: "In aziende con cadenza fatturazione",
      value: invoicedCount,
      hint: "Aziende con cadenza monthly/quarterly/semiannual impostata",
    },
  ];
}

export function useStatistiche(range: StatistichePeriodo, now: Date): StatisticheData {
  const filters = useMemo(() => filtersForRange(range, now), [range, now]);
  const { items, loading } = useAttivita(filters);
  const lastYearFilters = useMemo(
    () => ({
      from: new Date(now.getFullYear() - 1, 0, 1),
      to: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999),
    }),
    [now]
  );
  const { items: lastYearItems } = useAttivita(lastYearFilters);
  const aziendeQuery = useAziende();
  const aziende = aziendeQuery.data ?? EMPTY_AZIENDE;

  const byTipo = useMemo(() => byTipoSlices(items), [items]);
  const topClients = useMemo(() => topClientsSlices(items), [items]);
  const monthlyComparison = useMemo(
    () => monthlyComparisonOf(items, lastYearItems, now),
    [items, lastYearItems, now]
  );
  const stackedMonths = useMemo(() => stackedMonthsOf(items, now), [items, now]);
  const funnel = useMemo(() => funnelOf(items, aziende), [items, aziende]);
  const totalRange = useMemo(
    () => items.reduce((s, a) => s + a.totale, 0),
    [items]
  );
  const totalLastYear = useMemo(
    () => lastYearItems.reduce((s, a) => s + a.totale, 0),
    [lastYearItems]
  );
  const yoyDiff =
    totalLastYear > 0
      ? Math.round(((totalRange - totalLastYear) / totalLastYear) * 100)
      : null;

  return {
    loading,
    items,
    aziende,
    byTipo,
    topClients,
    monthlyComparison,
    stackedMonths,
    funnel,
    totalRange,
    totalLastYear,
    yoyDiff,
  };
}
