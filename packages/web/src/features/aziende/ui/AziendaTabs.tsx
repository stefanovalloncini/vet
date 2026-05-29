import { Link } from "react-router-dom";
import { ClipboardList, Bell } from "lucide-react";
import { Card, EmptyState } from "../../../shared/ui";
import { useReminders } from "../../reminders/hooks/useReminders";
import { formatDate, formatEuro } from "../../../shared/lib/format";
import { routes } from "../../../routes";
import type { Attivita } from "@vet/shared";

export function StoricoTab({ items }: { items: Attivita[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Nessuna attività registrata."
        icon={<ClipboardList size={28} strokeWidth={1.5} />}
      />
    );
  }
  return (
    <ul className="space-y-2">
      {items.map((a) => (
        <li key={a.id}>
          <Link
            to={routes.attivitaEdit.to({ id: a.id })}
            className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-2 sm:rounded-2xl"
          >
            <Card className="hover:border-(--color-border-strong) transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-(--color-text-muted) tabular-nums">
                    {formatDate(a.data)}
                  </p>
                  <p className="text-base font-medium text-(--color-text) mt-1 break-words">
                    {a.tipoNome}
                  </p>
                  {a.note ? (
                    <p className="text-xs text-(--color-text-subtle) mt-1 break-words line-clamp-3">
                      {a.note}
                    </p>
                  ) : null}
                </div>
                <span className="shrink-0 text-base font-medium text-(--color-text) tabular-nums">
                  {formatEuro(a.totale)}
                </span>
              </div>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function PromemoriaTab({ aziendaId }: { aziendaId: string }) {
  const { reminders } = useReminders();
  const filtered = reminders.filter((r) => r.aziendaId === aziendaId);
  if (filtered.length === 0) {
    return (
      <EmptyState
        title="Nessun promemoria attivo."
        icon={<Bell size={28} strokeWidth={1.5} />}
      />
    );
  }
  return (
    <ul className="space-y-2">
      {filtered.map((r) => (
        <li key={r.id}>
          <Card>
            <div className="flex items-baseline justify-between gap-3">
              <p
                className={[
                  "min-w-0 break-words text-base",
                  r.done
                    ? "text-(--color-text-muted) line-through"
                    : "text-(--color-text)",
                ].join(" ")}
              >
                {r.titolo}
              </p>
              <span className="shrink-0 text-xs text-(--color-text-muted) tabular-nums">
                {formatDate(r.dueAt)}
              </span>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
