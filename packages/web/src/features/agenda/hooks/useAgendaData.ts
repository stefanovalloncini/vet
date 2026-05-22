import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Attivita } from "@vet/shared";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { queryKeys } from "../../../shared/data/queryClient";
import { endOfMonth, startOfMonth } from "../lib/calendar";

export type AgendaViewMode = "month" | "week";

interface Reminder {
  readonly id: string;
}

interface UseAgendaDataInput {
  readonly selectedDate: Date;
  readonly viewMode: AgendaViewMode;
}

interface UseAgendaDataResult {
  readonly rangeStart: Date;
  readonly rangeEnd: Date;
  readonly items: Attivita[];
  readonly reminders: Reminder[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly refresh: () => Promise<void>;
}

function startOfWeek(d: Date): Date {
  const dayOfWeek = (d.getDay() + 6) % 7;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - dayOfWeek, 0, 0, 0, 0);
}

function endOfWeek(d: Date): Date {
  const start = startOfWeek(d);
  return new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate() + 6,
    23,
    59,
    59,
    999
  );
}

function computeRange(
  date: Date,
  viewMode: AgendaViewMode
): { rangeStart: Date; rangeEnd: Date } {
  return viewMode === "week"
    ? { rangeStart: startOfWeek(date), rangeEnd: endOfWeek(date) }
    : { rangeStart: startOfMonth(date), rangeEnd: endOfMonth(date) };
}

export function useAgendaData({
  selectedDate,
  viewMode,
}: UseAgendaDataInput): UseAgendaDataResult {
  const { attivita: repo } = useRepositories();
  const epoch = selectedDate.getTime();
  const range = useMemo(
    () => computeRange(new Date(epoch), viewMode),
    [epoch, viewMode]
  );

  const fromMs = range.rangeStart.getTime();
  const toMs = range.rangeEnd.getTime();

  const query = useQuery<Attivita[]>({
    queryKey: queryKeys.agenda({ from: fromMs, to: toMs }),
    queryFn: () => repo.list({ from: new Date(fromMs), to: new Date(toMs) }),
  });

  const refresh = async (): Promise<void> => {
    await query.refetch();
  };

  return {
    rangeStart: range.rangeStart,
    rangeEnd: range.rangeEnd,
    items: query.data ?? [],
    reminders: [],
    loading: query.isPending,
    error: query.isError ? "load-failed" : null,
    refresh,
  };
}
