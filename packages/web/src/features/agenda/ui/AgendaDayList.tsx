import { Link } from "react-router-dom";
import { CornerDownRight } from "lucide-react";
import { Badge, Card, LoadingHint } from "../../../shared/ui";
import { useAuthState } from "../../auth";
import type { Attivita } from "@vet/shared";
import { agendaI18n as t } from "../i18n";
import { dateInputValue } from "../../../shared/lib/format";

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

function formatTime(date: Date): string {
  return date.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function compareByTime(a: Attivita, b: Attivita): number {
  return a.createdAt.getTime() - b.createdAt.getTime();
}

export function AgendaDayList({ date, items, loading = false }: AgendaDayListProps) {
  const { user } = useAuthState();
  const canCreate = user?.caps.has("activities.create") ?? false;
  const dayItems = items
    .filter((a) => dateInputValue(a.data) === dateInputValue(date))
    .sort(compareByTime);
  const isEmpty = !loading && dayItems.length === 0;
  const newHref = `/attivita/nuova?data=${dateInputValue(date)}`;

  return (
    <section aria-label="Attività del giorno" className="min-w-0">
      <header className="mb-3 px-1">
        <h2 className="text-sm font-medium text-(--color-text-muted) capitalize">
          {formatHeading(date)}
        </h2>
      </header>

      {loading ? (
        <LoadingHint label={t.loading} className="px-1" />
      ) : isEmpty ? (
        <EmptyDayState canCreate={canCreate} newHref={newHref} />
      ) : (
        <ul className="space-y-2">
          {dayItems.map((a) => (
            <li key={a.id}>
              <AgendaRow attivita={a} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

interface AgendaRowProps {
  readonly attivita: Attivita;
}

function AgendaRow({ attivita }: AgendaRowProps) {
  return (
    <Link
      to={`/attivita/${attivita.id}`}
      className="block rounded-xl sm:rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-2"
    >
      <Card
        padding="sm"
        className="hover:border-(--color-border-strong) transition-[border-color,background-color] duration-(--motion-fast) ease-(--ease-out-quart) hover:bg-(--color-surface-muted)/40"
      >
        <div className="flex items-center gap-3">
          <time
            dateTime={attivita.createdAt.toISOString()}
            className="font-mono text-sm text-(--color-text-muted) tabular-nums shrink-0 w-12"
          >
            {formatTime(attivita.createdAt)}
          </time>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-(--color-text) truncate">
              {attivita.aziendaNome}
            </p>
            <p className="text-xs text-(--color-text-muted) truncate mt-0.5">
              {attivita.ownerName}
            </p>
          </div>
          <Badge tone="accent" size="sm">
            {attivita.tipoNome}
          </Badge>
        </div>
      </Card>
    </Link>
  );
}

interface EmptyDayStateProps {
  readonly canCreate: boolean;
  readonly newHref: string;
}

function EmptyDayState({ canCreate, newHref }: EmptyDayStateProps) {
  return (
    <div className="px-1 py-8 flex flex-col items-start gap-3">
      <p className="text-sm text-(--color-text)">{t.emptyDay}</p>
      {canCreate ? (
        <div className="flex items-center gap-2 text-(--color-text-muted)">
          <CornerDownRight size={16} strokeWidth={1.75} aria-hidden="true" />
          <Link
            to={newHref}
            className="text-sm text-(--color-accent) hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-2 rounded-md"
          >
            {t.nuovaCta}
          </Link>
        </div>
      ) : (
        <p className="text-xs text-(--color-text-muted)">{t.emptyHint}</p>
      )}
    </div>
  );
}
