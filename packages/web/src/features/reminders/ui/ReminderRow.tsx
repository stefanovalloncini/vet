import { Button } from "../../../shared/ui";
import { remindersI18n as t } from "../i18n";
import { daysUntil, humanDays } from "../lib/dates";
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
  return (
    <li className="px-4 py-3 sm:px-5 sm:py-4 flex items-start gap-3 hover:bg-(--color-surface-muted)/40 transition-colors">
      {canUpdate ? (
        <input
          type="checkbox"
          checked={r.done}
          onChange={onToggle}
          className="mt-1 w-4 h-4 accent-(--color-accent) flex-shrink-0"
          aria-label={r.done ? t.fatto : t.nonFatto}
        />
      ) : null}
      <div className="min-w-0 flex-1">
        <p
          className={[
            "text-sm font-medium",
            r.done
              ? "text-(--color-text-muted) line-through"
              : "text-(--color-text)",
          ].join(" ")}
        >
          {r.titolo}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
          <span className="text-(--color-text-muted)">{r.aziendaNome}</span>
          <span
            className={[
              "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-mono tabular-nums",
              overdue
                ? "bg-(--color-danger)/10 text-(--color-danger)"
                : r.done
                ? "bg-(--color-surface-muted) text-(--color-text-subtle)"
                : "bg-(--color-surface-muted) text-(--color-text-muted)",
            ].join(" ")}
          >
            <span className="font-sans">{humanDays(days, r.done)}</span>
            <span aria-hidden="true" className="text-(--color-text-subtle)">·</span>
            <span>{r.dueAt.toLocaleDateString("it-IT")}</span>
          </span>
        </div>
        {r.note ? (
          <p className="text-xs text-(--color-text-subtle) mt-2 whitespace-pre-line">
            {r.note}
          </p>
        ) : null}
      </div>
      {canDelete ? (
        <Button type="button" variant="ghost" size="sm" onClick={onDelete}>
          {t.elimina}
        </Button>
      ) : null}
    </li>
  );
}
