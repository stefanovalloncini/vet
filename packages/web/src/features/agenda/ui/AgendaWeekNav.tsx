import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../../shared/ui";
import { MONTHS, agendaI18n as t } from "../i18n";
import { addDays, startOfWeek } from "../lib/calendar";

interface AgendaWeekNavProps {
  readonly selectedDate: Date;
  readonly onSelectDate: (date: Date) => void;
}

const arrowCls =
  "w-11 h-11 inline-flex items-center justify-center rounded-md text-(--color-text-muted) hover:bg-(--color-surface-muted) hover:text-(--color-text) transition-colors duration-(--motion-fast) ease-(--ease-out-quart) active:scale-[0.97] active:duration-(--motion-press) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent)";

export function AgendaWeekNav({ selectedDate, onSelectDate }: AgendaWeekNavProps) {
  const mid = useMemo(
    () => addDays(startOfWeek(selectedDate), 3),
    [selectedDate]
  );
  const monthLabel = `${MONTHS[mid.getMonth()]} ${mid.getFullYear()}`;

  const shiftWeek = (delta: number) =>
    onSelectDate(addDays(selectedDate, delta * 7));
  const goToday = () => onSelectDate(new Date());

  return (
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
          className={arrowCls}
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
          className={arrowCls}
        >
          <ChevronRight size={18} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
