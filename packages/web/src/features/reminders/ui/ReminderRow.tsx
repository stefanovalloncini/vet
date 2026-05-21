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
    <li className="px-4 py-3 flex items-start gap-3">
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
        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
          <span className="text-(--color-text-muted)">{r.aziendaNome}</span>
          <span
            className={[
              "px-2 py-0.5 rounded-md",
              overdue
                ? "bg-(--color-danger)/10 text-(--color-danger)"
                : "bg-(--color-surface-muted) text-(--color-text-muted)",
            ].join(" ")}
          >
            {humanDays(days, r.done)}
            {" · "}
            {r.dueAt.toLocaleDateString("it-IT")}
          </span>
        </div>
        {r.note ? (
          <p className="text-xs text-(--color-text-subtle) mt-2">{r.note}</p>
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
