import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Attivita } from "@vet/shared";
import { Button } from "../../../shared/ui";
import { MONTHS, WEEKDAYS_SHORT, agendaI18n as t } from "../i18n";
import { addDays, buildWeekStrip, sameDay, startOfWeek } from "../lib/calendar";
import { dateInputValue } from "../../../shared/lib/format";

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
  const mid = useMemo(() => addDays(weekStart, 3), [weekStart]);
  const monthLabel = `${MONTHS[mid.getMonth()]} ${mid.getFullYear()}`;

  const shiftWeek = (delta: number) => onSelectDate(addDays(selectedDate, delta * 7));
  const goToday = () => onSelectDate(new Date());

  return (
    <section
      aria-label="Selettore data"
      className="mb-5 sm:mb-6 print:hidden"
    >
      <div className="flex items-center justify-between mb-3">
        <h2
          className="text-base font-medium text-(--color-text) capitalize tabular-nums"
          aria-live="polite"
        >
          {monthLabel}
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shiftWeek(-1)}
            aria-label={t.settimanaScorsa}
            className="w-11 h-11 inline-flex items-center justify-center rounded-lg text-(--color-text-muted) hover:bg-(--color-surface-muted) hover:text-(--color-text) transition-colors duration-(--motion-fast) ease-(--ease-out-quart) active:scale-[0.97] active:duration-(--motion-press) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent)"
          >
            <ChevronLeft size={18} strokeWidth={2} aria-hidden="true" />
          </button>
          <Button type="button" variant="ghost" size="sm" onClick={goToday}>
            {t.oggi}
          </Button>
          <button
            type="button"
            onClick={() => shiftWeek(1)}
            aria-label={t.settimanaProssima}
            className="w-11 h-11 inline-flex items-center justify-center rounded-lg text-(--color-text-muted) hover:bg-(--color-surface-muted) hover:text-(--color-text) transition-colors duration-(--motion-fast) ease-(--ease-out-quart) active:scale-[0.97] active:duration-(--motion-press) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent)"
          >
            <ChevronRight size={18} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div role="radiogroup" aria-label="Giorni della settimana" className="grid grid-cols-7 gap-1.5">
        {days.map((d) => {
          const count = counts.get(dateInputValue(d.date)) ?? 0;
          const isSelected = sameDay(d.date, selectedDate);
          const idx = (d.date.getDay() + 6) % 7;
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
