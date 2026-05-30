import { useMemo } from "react";
import { Link } from "react-router-dom";
import type { Attivita } from "@vet/shared";
import { WEEKDAYS, agendaI18n as t } from "../i18n";
import { groupWeekByWeekday, type WeekDayColumn } from "../lib/calendar";
import { mondayIndex } from "../../../shared/lib/format";
import { openQuickEntry } from "../../quick-entry";
import { routes } from "../../../routes";

interface AgendaWeekBoardProps {
  readonly selectedDate: Date;
  readonly items: Attivita[];
  readonly canCreate: boolean;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

export function AgendaWeekBoard({
  selectedDate,
  items,
  canCreate,
}: AgendaWeekBoardProps) {
  const columns = useMemo(
    () => groupWeekByWeekday(selectedDate, items),
    [selectedDate, items]
  );

  return (
    <section
      aria-label="Settimana"
      className="grid grid-cols-7 gap-px rounded-lg border border-(--color-border) bg-(--color-border) overflow-hidden"
    >
      {columns.map((col) => (
        <DayColumn key={col.date.toISOString()} column={col} canCreate={canCreate} />
      ))}
    </section>
  );
}

interface DayColumnProps {
  readonly column: WeekDayColumn;
  readonly canCreate: boolean;
}

function DayColumn({ column, canCreate }: DayColumnProps) {
  const idx = mondayIndex(column.date);
  return (
    <div className="flex flex-col bg-(--color-surface) min-h-64">
      <header
        className={[
          "flex items-baseline justify-between px-3 py-2 border-b border-(--color-border)",
          column.isToday ? "bg-(--color-accent-soft)" : "bg-(--color-surface-muted)",
        ].join(" ")}
      >
        <span
          className={[
            "text-[11px] uppercase tracking-[0.06em] font-medium",
            column.isToday ? "text-(--color-accent)" : "text-(--color-text-subtle)",
          ].join(" ")}
        >
          {WEEKDAYS[idx]}
        </span>
        <span
          className={[
            "text-sm font-semibold tabular-nums leading-none",
            column.isToday ? "text-(--color-accent)" : "text-(--color-text)",
          ].join(" ")}
        >
          {column.date.getDate()}
        </span>
      </header>
      <div className="flex-1 p-1.5 space-y-1.5">
        {column.items.length === 0 ? (
          <EmptyColumn canCreate={canCreate} />
        ) : (
          column.items.map((a) => <ActivityCard key={a.id} attivita={a} />)
        )}
      </div>
    </div>
  );
}

interface ActivityCardProps {
  readonly attivita: Attivita;
}

function ActivityCard({ attivita }: ActivityCardProps) {
  return (
    <Link
      to={routes.attivitaEdit.to({ id: attivita.id })}
      className="block rounded-md border border-(--color-border) bg-(--color-surface) px-2 py-1.5 hover:border-(--color-border-strong) hover:bg-(--color-surface-muted)/40 transition-[border-color,background-color] duration-(--motion-fast) ease-(--ease-out-quart) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-1"
    >
      <div className="flex items-center gap-1.5">
        <time
          dateTime={attivita.data.toISOString()}
          className="font-mono text-[11px] text-(--color-text-muted) tabular-nums shrink-0"
        >
          {formatTime(attivita.data)}
        </time>
        <span className="text-[11px] font-medium text-(--color-accent) truncate">
          {attivita.tipoNome}
        </span>
      </div>
      <p className="text-sm text-(--color-text) truncate mt-0.5">
        {attivita.aziendaNome}
      </p>
    </Link>
  );
}

interface EmptyColumnProps {
  readonly canCreate: boolean;
}

function EmptyColumn({ canCreate }: EmptyColumnProps) {
  if (!canCreate) {
    return <span className="block px-1 pt-1 text-[11px] text-(--color-text-subtle)">{t.emptyShort}</span>;
  }
  return (
    <button
      type="button"
      onClick={openQuickEntry}
      className="block w-full text-left rounded-md px-2 py-1.5 text-[11px] text-(--color-text-subtle) hover:text-(--color-accent) hover:bg-(--color-surface-muted)/60 transition-colors duration-(--motion-fast) ease-(--ease-out-quart) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent)"
    >
      {t.aggiungiShort}
    </button>
  );
}
