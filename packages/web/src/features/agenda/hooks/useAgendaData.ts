import { useMemo } from "react";
import type { Attivita } from "@vet/shared";
import { useAttivita } from "../../attivita/hooks/useAttivita";
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

function computeRange(date: Date, viewMode: AgendaViewMode): {
  rangeStart: Date;
  rangeEnd: Date;
  filters: { from: Date; to: Date };
} {
  const { rangeStart, rangeEnd } =
    viewMode === "week"
      ? { rangeStart: startOfWeek(date), rangeEnd: endOfWeek(date) }
      : { rangeStart: startOfMonth(date), rangeEnd: endOfMonth(date) };
  return { rangeStart, rangeEnd, filters: { from: rangeStart, to: rangeEnd } };
}

export function useAgendaData({
  selectedDate,
  viewMode,
}: UseAgendaDataInput): UseAgendaDataResult {
  const epoch = selectedDate.getTime();
  const range = useMemo(
    () => computeRange(new Date(epoch), viewMode),
    [epoch, viewMode]
  );

  const { items, loading, error, refresh } = useAttivita(range.filters);

  return {
    rangeStart: range.rangeStart,
    rangeEnd: range.rangeEnd,
    items,
    reminders: [],
    loading,
    error,
    refresh,
  };
}
