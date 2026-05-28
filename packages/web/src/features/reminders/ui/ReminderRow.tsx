import { Button } from "../../../shared/ui";
import { remindersI18n as t } from "../i18n";
import { daysUntil, humanDays } from "../lib/dates";
import { formatDate } from "../../../shared/lib/format";
import type { Reminder } from "@vet/shared";

interface ReminderRowProps {
  reminder: Reminder;
  canUpdate: boolean;
  canDelete: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

export function ReminderRow({
  reminder: r,
  canUpdate,
  canDelete,
  onToggle,
  onDelete,
}: ReminderRowProps) {
  const days = daysUntil(r.dueAt);
  const overdue = !r.done && days < 0;
  const titolo = r.titolo?.trim() ? r.titolo : t.senzaTitolo;
  return (
    <li className="px-4 py-3 sm:px-5 sm:py-4 flex items-start gap-2 sm:gap-3 hover:bg-(--color-surface-muted)/40 transition-colors">
      {canUpdate ? (
        <label className="-m-2 p-2 flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={r.done}
            onChange={onToggle}
            className="w-4 h-4 accent-(--color-accent)"
            aria-label={`${titolo}: ${r.done ? t.segnaNonFatto : t.segnaFatto}`}
          />
        </label>
      ) : null}
      <div className="min-w-0 flex-1">
        <p
          className={[
            "text-sm font-medium break-words",
            r.done
              ? "text-(--color-text-muted) line-through"
              : "text-(--color-text)",
          ].join(" ")}
        >
          {titolo}
        </p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-xs">
          {r.aziendaNome ? (
            <span className="text-(--color-text-muted) break-words min-w-0">
              {r.aziendaNome}
            </span>
          ) : null}
          <span
            className={[
              "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md tabular-nums whitespace-nowrap",
              overdue
                ? "bg-(--color-danger)/10 text-(--color-danger)"
                : r.done
                  ? "bg-(--color-surface-muted) text-(--color-text-subtle)"
                  : "bg-(--color-surface-muted) text-(--color-text-muted)",
            ].join(" ")}
          >
            <span>{humanDays(days, r.done)}</span>
            <span aria-hidden="true" className="text-(--color-text-subtle)">
              ·
            </span>
            <span className="font-mono">{formatDate(r.dueAt)}</span>
          </span>
        </div>
        {r.note ? (
          <p className="text-xs text-(--color-text-subtle) mt-2 whitespace-pre-line break-words">
            {r.note}
          </p>
        ) : null}
      </div>
      {canDelete ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="shrink-0"
        >
          {t.elimina}
        </Button>
      ) : null}
    </li>
  );
}
