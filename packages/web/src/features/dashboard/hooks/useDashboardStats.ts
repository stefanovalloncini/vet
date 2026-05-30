import { useMemo } from "react";
import { useAttivita } from "../../attivita/hooks/useAttivita";
import { useAziende } from "../../aziende/hooks/useAziende";
import { useAuthState } from "../../auth";
import {
  endOfMonthLocal,
  startOfMonthLocal,
  statsForRange,
  trailingMonths,
  type MonthStats,
} from "../lib/stats";
import { roundCents } from "../../../shared/lib/money";
import type { Attivita, Azienda, AttivitaFilters } from "@vet/shared";

export interface TipoBreakdownRow {
  id: string;
  nome: string;
  count: number;
  total: number;
}

export interface DashboardStats {
  loading: boolean;
  isError: boolean;
  items: Attivita[];
  aziende: Azienda[];
  thisMonth: MonthStats;
  aziendeAttiveCount: number;
  trailing: { totals: number[]; counts: number[]; labels: string[] };
  trailingTotal: number;
  recent: Attivita[];
  tipiMese: TipoBreakdownRow[];
}

const TRAILING_MONTHS = 12;
const RECENT_LIMIT = 8;
const TIPI_LIMIT = 6;
const EMPTY_AZIENDE: Azienda[] = [];

export function useDashboardStats(now: Date): DashboardStats {
  const { user } = useAuthState();
  const ownerUid = user?.uid ?? null;
  const monthStart = useMemo(() => startOfMonthLocal(now), [now]);
  const monthEnd = useMemo(() => endOfMonthLocal(now), [now]);
  const trailingStart = useMemo(
    () => new Date(now.getFullYear() - 1, now.getMonth() + 1, 1),
    [now]
  );
  const allRangeFilters = useMemo<AttivitaFilters>(
    () =>
      ownerUid
        ? { from: trailingStart, to: monthEnd, ownerUid }
        : { from: trailingStart, to: monthEnd },
    [trailingStart, monthEnd, ownerUid]
  );

  const attivitaResult = useAttivita(allRangeFilters);
  const aziendeQuery = useAziende();
  const items = attivitaResult.items;
  const loading = attivitaResult.loading || aziendeQuery.isPending;
  const isError = attivitaResult.isError || aziendeQuery.isError;
  const aziende = aziendeQuery.data ?? EMPTY_AZIENDE;

  const thisMonth = useMemo(
    () => statsForRange(items, monthStart, monthEnd),
    [items, monthStart, monthEnd]
  );

  const trailing = useMemo(
    () => trailingMonths(items, now, TRAILING_MONTHS),
    [items, now]
  );

  const trailingTotal = useMemo(
    () => roundCents(trailing.totals.reduce((s, v) => s + v, 0)),
    [trailing]
  );

  const recent = useMemo(
    () =>
      [...items]
        .sort((a, b) => b.data.getTime() - a.data.getTime())
        .slice(0, RECENT_LIMIT),
    [items]
  );

  const tipiMese = useMemo<TipoBreakdownRow[]>(
    () =>
      [...thisMonth.byTipo.entries()]
        .map(([id, v]) => ({ id, nome: v.nome, count: v.count, total: v.total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, TIPI_LIMIT),
    [thisMonth]
  );

  return {
    loading,
    isError,
    items,
    aziende,
    thisMonth,
    aziendeAttiveCount: thisMonth.byAzienda.size,
    trailing,
    trailingTotal,
    recent,
    tipiMese,
  };
}
