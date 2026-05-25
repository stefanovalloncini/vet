import { useMemo } from "react";
import { useAttivita } from "../../attivita/hooks/useAttivita";
import { useAziende } from "../../aziende/hooks/useAziende";
import {
  endOfMonthLocal,
  percentDiff,
  startOfMonthLocal,
  statsForRange,
  trailingMonths,
} from "../lib/stats";
import type { Attivita, Azienda } from "@vet/shared";

interface MonthStats {
  total: number;
  count: number;
  byAzienda: Map<string, { nome: string; total: number; count: number }>;
  byTipo: Map<string, { nome: string; total: number; count: number }>;
}

export interface DashboardStats {
  loading: boolean;
  isError: boolean;
  items: Attivita[];
  aziende: Azienda[];
  thisMonth: MonthStats;
  countDiff: number | null;
  aziendeAttiveCount: number;
  trailing: { totals: number[]; counts: number[]; labels: string[] };
}

const TRAILING_MONTHS = 12;
const EMPTY_AZIENDE: Azienda[] = [];

export function useDashboardStats(now: Date): DashboardStats {
  const monthStart = useMemo(() => startOfMonthLocal(now), [now]);
  const monthEnd = useMemo(() => endOfMonthLocal(now), [now]);
  const lastMonthStart = useMemo(
    () => new Date(now.getFullYear(), now.getMonth() - 1, 1),
    [now]
  );
  const lastMonthEnd = useMemo(
    () => new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999),
    [now]
  );
  const trailingStart = useMemo(
    () => new Date(now.getFullYear() - 1, now.getMonth() + 1, 1),
    [now]
  );
  const allRangeFilters = useMemo(
    () => ({ from: trailingStart, to: monthEnd }),
    [trailingStart, monthEnd]
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
  const lastMonth = useMemo(
    () => statsForRange(items, lastMonthStart, lastMonthEnd),
    [items, lastMonthStart, lastMonthEnd]
  );

  const trailing = useMemo(
    () => trailingMonths(items, now, TRAILING_MONTHS),
    [items, now]
  );

  return {
    loading,
    isError,
    items,
    aziende,
    thisMonth,
    countDiff: percentDiff(thisMonth.count, lastMonth.count),
    aziendeAttiveCount: thisMonth.byAzienda.size,
    trailing,
  };
}
