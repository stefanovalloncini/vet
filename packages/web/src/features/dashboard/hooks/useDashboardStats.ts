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
import type { Attivita, Azienda, AttivitaFilters } from "@vet/shared";

export interface DashboardStats {
  loading: boolean;
  isError: boolean;
  items: Attivita[];
  aziende: Azienda[];
  thisMonth: MonthStats;
  aziendeAttiveCount: number;
  trailing: { totals: number[]; counts: number[]; labels: string[] };
}

const TRAILING_MONTHS = 12;
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

  return {
    loading,
    isError,
    items,
    aziende,
    thisMonth,
    aziendeAttiveCount: thisMonth.byAzienda.size,
    trailing,
  };
}
