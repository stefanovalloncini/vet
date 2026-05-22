import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Attivita, Azienda, Payment, Reminder } from "@vet/shared";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { computeArrears } from "../../payments/lib/arrears";
import { queryKeys } from "../../../shared/data/queryClient";
import {
  endOfMonthLocal,
  percentDiff,
  startOfMonthLocal,
  statsForRange,
  topEntry,
  trailingMonths,
} from "../lib/stats";

interface MonthStats {
  total: number;
  count: number;
  byAzienda: Map<string, { nome: string; total: number; count: number }>;
  byTipo: Map<string, { nome: string; total: number; count: number }>;
}

export interface DashboardStats {
  loading: boolean;
  isLoading: boolean;
  isError: boolean;
  items: Attivita[];
  aziende: Azienda[];
  thisMonth: MonthStats;
  lastMonth: MonthStats;
  totalDiff: number | null;
  countDiff: number | null;
  topAzienda: { key: string; value: { nome: string; total: number; count: number } } | null;
  topTipo: { key: string; value: { nome: string; total: number; count: number } } | null;
  arrearsTotal: number;
  aziendeAttiveCount: number;
  trailing: { totals: number[]; labels: string[] };
  topTipoBars: Array<{ label: string; value: number }>;
  urgentReminders: Reminder[];
  recentAziende: Array<{ id: string; nome: string }>;
}

const URGENT_WINDOW_MS = 7 * 86_400_000;
const RECENT_AZIENDE_LIMIT = 4;
const TOP_TIPO_LIMIT = 8;
const TRAILING_MONTHS = 12;

export function useDashboardStats(now: Date): DashboardStats {
  const {
    aziende: aziendeRepo,
    attivita: attivitaRepo,
    payments: paymentsRepo,
    reminders: remindersRepo,
  } = useRepositories();

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

  const rangeFilters = useMemo(
    () => ({ from: trailingStart.toISOString(), to: monthEnd.toISOString() }),
    [trailingStart, monthEnd]
  );

  const attivitaQuery = useQuery<Attivita[]>({
    queryKey: queryKeys.attivita(rangeFilters),
    queryFn: () => attivitaRepo.list({ from: trailingStart, to: monthEnd }),
  });

  const arrearsQuery = useQuery<{
    aziende: Azienda[];
    attivita: Attivita[];
    payments: Payment[];
  }>({
    queryKey: queryKeys.dashboardStats({ scope: "arrears" }),
    queryFn: async () => {
      const [a, t, p] = await Promise.all([
        aziendeRepo.list(),
        attivitaRepo.list(),
        paymentsRepo.list(),
      ]);
      return { aziende: a, attivita: t, payments: p };
    },
  });

  const remindersQuery = useQuery<Reminder[]>({
    queryKey: queryKeys.reminders({ onlyOpen: true }),
    queryFn: () => remindersRepo.list({ onlyOpen: true }),
  });

  const items = attivitaQuery.data ?? [];
  const aziende = arrearsQuery.data?.aziende ?? [];
  const allAttivita = arrearsQuery.data?.attivita ?? [];
  const allPayments = arrearsQuery.data?.payments ?? [];
  const openReminders = remindersQuery.data ?? [];

  const loading =
    attivitaQuery.isLoading || arrearsQuery.isLoading || remindersQuery.isLoading;
  const isError =
    attivitaQuery.isError || arrearsQuery.isError || remindersQuery.isError;

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

  const arrearsTotal = useMemo(() => {
    if (aziende.length === 0) return 0;
    const arrears = computeArrears(aziende, allAttivita, allPayments, now);
    return arrears.reduce((s, a) => s + a.unpaidTotal, 0);
  }, [aziende, allAttivita, allPayments, now]);

  const urgentReminders = useMemo(
    () =>
      openReminders
        .filter((r) => r.dueAt.getTime() <= now.getTime() + URGENT_WINDOW_MS)
        .slice(0, 5),
    [openReminders, now]
  );

  const recentAziende = useMemo(() => {
    const seen = new Set<string>();
    const out: { id: string; nome: string }[] = [];
    for (const a of items) {
      if (seen.has(a.aziendaId)) continue;
      seen.add(a.aziendaId);
      out.push({ id: a.aziendaId, nome: a.aziendaNome });
      if (out.length >= RECENT_AZIENDE_LIMIT) break;
    }
    return out;
  }, [items]);

  const topTipoBars = useMemo(
    () =>
      [...thisMonth.byTipo.values()]
        .sort((a, b) => b.total - a.total)
        .slice(0, TOP_TIPO_LIMIT)
        .map((v) => ({ label: v.nome, value: v.total })),
    [thisMonth.byTipo]
  );

  return {
    loading,
    isLoading: loading,
    isError,
    items,
    aziende,
    thisMonth,
    lastMonth,
    totalDiff: percentDiff(thisMonth.total, lastMonth.total),
    countDiff: percentDiff(thisMonth.count, lastMonth.count),
    topAzienda: topEntry(thisMonth.byAzienda),
    topTipo: topEntry(thisMonth.byTipo),
    arrearsTotal,
    aziendeAttiveCount: thisMonth.byAzienda.size,
    trailing,
    topTipoBars,
    urgentReminders,
    recentAziende,
  };
}
