import { Link } from "react-router-dom";
import { Card, EmptyState } from "../../../shared/ui";
import { useReminders } from "../../reminders/hooks/useReminders";
import { formatDate, formatEuro } from "../../attivita/lib/format";
import type { Attivita, Payment } from "@vet/shared";

export function StoricoTab({ items }: { items: Attivita[] }) {
  if (items.length === 0) {
    return <EmptyState title="Nessuna attività registrata." size="sm" />;
  }
  return (
    <ul className="space-y-2">
      {items.map((a) => (
        <li key={a.id}>
          <Link to={`/attivita/${a.id}`} className="block">
            <Card className="hover:border-(--color-border-strong) transition-colors">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-(--color-text-muted) tabular-nums">
                    {formatDate(a.data)}
                  </p>
                  <p className="text-base font-medium text-(--color-text) mt-1">
                    {a.tipoNome}
                  </p>
                  {a.note ? (
                    <p className="text-xs text-(--color-text-subtle) mt-1">
                      {a.note}
                    </p>
                  ) : null}
                </div>
                <span className="text-base font-medium text-(--color-text) tabular-nums">
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

export function PagamentiTab({ payments }: { payments: Payment[] }) {
  if (payments.length === 0) {
    return <EmptyState title="Nessun pagamento registrato." size="sm" />;
  }
  return (
    <ul className="space-y-2">
      {payments.map((p) => (
        <li key={p.id}>
          <Card>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-base text-(--color-text)">
                  Pagato fino al {p.periodoFinoA.toLocaleDateString("it-IT")}
                </p>
                <p className="text-xs text-(--color-text-muted) mt-1">
                  {p.metodoPagamento ?? "metodo non indicato"}
                  {p.note ? ` · ${p.note}` : ""}
                </p>
              </div>
              {p.importoPagato !== undefined ? (
                <span className="text-base font-medium text-(--color-text) tabular-nums">
                  {formatEuro(p.importoPagato)}
                </span>
              ) : null}
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}

export function PromemoriaTab({ aziendaId }: { aziendaId: string }) {
  const { reminders } = useReminders();
  const filtered = reminders.filter((r) => r.aziendaId === aziendaId);
  if (filtered.length === 0) {
    return <EmptyState title="Nessun promemoria attivo." size="sm" />;
  }
  return (
    <ul className="space-y-2">
      {filtered.map((r) => (
        <li key={r.id}>
          <Card>
            <div className="flex items-baseline justify-between gap-3">
              <p
                className={[
                  "text-base",
                  r.done
                    ? "text-(--color-text-muted) line-through"
                    : "text-(--color-text)",
                ].join(" ")}
              >
                {r.titolo}
              </p>
              <span className="text-xs text-(--color-text-muted) tabular-nums">
                {r.dueAt.toLocaleDateString("it-IT")}
              </span>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
