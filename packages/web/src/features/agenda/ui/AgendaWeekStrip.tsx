import { useMemo } from "react";
import type { Attivita } from "@vet/shared";
import { WEEKDAYS_SHORT } from "../i18n";
import { buildWeekStrip, sameDay, startOfWeek } from "../lib/calendar";
import { dateInputValue, mondayIndex } from "../../../shared/lib/format";
import { AgendaWeekNav } from "./AgendaWeekNav";

interface AgendaWeekStripProps {
  readonly selectedDate: Date;
  readonly items: Attivita[];
  readonly onSelectDate: (date: Date) => void;
}

function buildCountsByDay(items: Attivita[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const a of items) {
    const k = dateInputValue(a.data);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

export function AgendaWeekStrip({
  selectedDate,
  items,
  onSelectDate,
}: AgendaWeekStripProps) {
  const weekStart = useMemo(() => startOfWeek(selectedDate), [selectedDate]);
  const days = useMemo(() => buildWeekStrip(weekStart), [weekStart]);
  const counts = useMemo(() => buildCountsByDay(items), [items]);

  return (
    <section
      aria-label="Selettore data"
      className="mb-5 sm:mb-6 print:hidden"
    >
      <AgendaWeekNav selectedDate={selectedDate} onSelectDate={onSelectDate} />

      <div role="radiogroup" aria-label="Giorni della settimana" className="grid grid-cols-7 gap-1.5">
        {days.map((d) => {
          const count = counts.get(dateInputValue(d.date)) ?? 0;
          const isSelected = sameDay(d.date, selectedDate);
          const idx = mondayIndex(d.date);
          return (
            <button
              key={d.date.toISOString()}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelectDate(d.date)}
              className={[
                "group flex flex-col items-center gap-1.5 py-2.5 rounded-xl",
                "transition-[background-color,color,box-shadow] duration-(--motion-fast) ease-(--ease-out-quart)",
                "active:scale-[0.97] active:duration-(--motion-press)",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-2",
                isSelected
                  ? "bg-(--color-accent) text-white"
                  : d.isToday
                  ? "bg-(--color-accent-soft) text-(--color-accent)"
                  : "text-(--color-text) hover:bg-(--color-surface-muted)",
              ].join(" ")}
            >
              <span
                className={[
                  "text-[10px] uppercase tracking-[0.08em] font-medium",
                  isSelected
                    ? "text-white/80"
                    : d.isToday
                    ? "text-(--color-accent)/80"
                    : "text-(--color-text-subtle)",
                ].join(" ")}
              >
                {WEEKDAYS_SHORT[idx]}
              </span>
              <span className="text-base font-medium tabular-nums leading-none">
                {d.date.getDate()}
              </span>
              <span
                aria-hidden="true"
                className={[
                  "h-1 w-1 rounded-full",
                  count > 0
                    ? isSelected
                      ? "bg-white"
                      : "bg-(--color-accent)"
                    : "bg-transparent",
                ].join(" ")}
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}
