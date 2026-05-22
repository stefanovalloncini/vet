import { useMemo } from "react";
import { Card } from "../../../shared/ui";
import type { Attivita } from "@vet/shared";
import { MONTHS, WEEKDAYS } from "../i18n";
import { buildMonthGrid, sameDay, startOfMonth } from "../lib/calendar";
import { dateInputValue } from "../../attivita/lib/format";
import type { AgendaViewMode } from "../hooks/useAgendaData";

interface AgendaCalendarProps {
  readonly selectedDate: Date;
  readonly viewMode: AgendaViewMode;
  readonly items: Attivita[];
  readonly reminders: readonly { id: string }[];
  readonly onSelectDate: (date: Date) => void;
  readonly onChangeViewMode?: (mode: AgendaViewMode) => void;
}

function buildCountsByDay(items: Attivita[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const a of items) {
    const k = dateInputValue(a.data);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

export function AgendaCalendar({
  selectedDate,
  items,
  onSelectDate,
}: AgendaCalendarProps) {
  const monthAnchor = useMemo(() => startOfMonth(selectedDate), [selectedDate]);
  const days = useMemo(() => buildMonthGrid(monthAnchor), [monthAnchor]);
  const counts = useMemo(() => buildCountsByDay(items), [items]);

  return (
    <Card className="mb-6 lg:mb-0 lg:sticky lg:top-6 !p-4 sm:!p-5">
      <h2 className="text-sm font-medium text-(--color-text) mb-3 capitalize">
        {MONTHS[monthAnchor.getMonth()]} {monthAnchor.getFullYear()}
      </h2>
      <div className="grid grid-cols-7 gap-0.5 text-[10px] uppercase tracking-[0.06em] text-(--color-text-subtle) mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((d) => {
          const count = counts.get(dateInputValue(d.date)) ?? 0;
          const isSelected = sameDay(d.date, selectedDate);
          return (
            <button
              key={d.date.toISOString()}
              type="button"
              onClick={() => onSelectDate(d.date)}
              aria-pressed={isSelected}
              className={[
                "aspect-square flex flex-col items-center justify-center gap-0.5 rounded-md text-sm",
                "transition-[background-color,color] duration-(--motion-fast) ease-(--ease-out-quart)",
                "active:scale-[0.97] active:duration-(--motion-press)",
                d.inMonth ? "text-(--color-text)" : "text-(--color-text-subtle)",
                isSelected
                  ? "bg-(--color-accent) text-white font-medium"
                  : d.isToday
                  ? "bg-(--color-accent-soft) text-(--color-accent) font-medium"
                  : "hover:bg-(--color-surface-muted)",
              ].join(" ")}
            >
              <span className="tabular-nums leading-none">{d.date.getDate()}</span>
              {count > 0 ? (
                <span
                  className={[
                    "w-1 h-1 rounded-full",
                    isSelected ? "bg-white" : "bg-(--color-accent)",
                  ].join(" ")}
                  aria-label={`${count} attività`}
                />
              ) : (
                <span className="w-1 h-1" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
