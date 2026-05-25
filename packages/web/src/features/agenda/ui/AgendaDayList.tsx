import { Link } from "react-router-dom";
import { Card, LoadingHint } from "../../../shared/ui";
import { useAuthState } from "../../auth";
import type { Attivita } from "@vet/shared";
import { agendaI18n as t } from "../i18n";
import { dateInputValue, formatEuro } from "../../../shared/lib/format";

interface AgendaDayListProps {
  readonly date: Date;
  readonly items: Attivita[];
  readonly reminders: readonly { id: string }[];
  readonly loading?: boolean;
}

function formatHeading(date: Date): string {
  return date.toLocaleDateString("it-IT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function AgendaDayList({ date, items, loading = false }: AgendaDayListProps) {
  const { user } = useAuthState();
  const canCreate = user?.caps.has("activities.create") ?? false;
  const dayItems = items.filter((a) => dateInputValue(a.data) === dateInputValue(date));

  return (
    <section className="print:block print:!mt-0 min-w-0">
      <header className="flex items-baseline justify-between mb-3 px-1 gap-3">
        <h2 className="text-sm font-medium text-(--color-text) capitalize truncate">
          {formatHeading(date)}
        </h2>
        <div className="flex items-center gap-3 shrink-0">
          {canCreate ? (
            <Link
              to={`/attivita/nuova?data=${dateInputValue(date)}`}
              className="text-sm text-(--color-accent) hover:underline print:hidden"
            >
              + Nuova
            </Link>
          ) : null}
        </div>
      </header>
      {loading ? (
        <LoadingHint label={t.loading} className="px-1" />
      ) : dayItems.length === 0 ? (
        <p className="text-sm text-(--color-text-muted) px-1 py-2">{t.emptyDay}</p>
      ) : (
        <ul className="space-y-2">
          {dayItems.map((a) => (
            <li key={a.id}>
              <Link to={`/attivita/${a.id}`} className="block">
                <Card className="hover:border-(--color-border-strong)">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-medium text-(--color-text) truncate">
                        {a.aziendaNome}
                      </p>
                      <p className="text-xs text-(--color-text-muted) mt-0.5 truncate">
                        {a.tipoNome} · {a.ownerName}
                      </p>
                    </div>
                    <span className="text-base font-medium text-(--color-text) tabular-nums shrink-0">
                      {formatEuro(a.totale)}
                    </span>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
