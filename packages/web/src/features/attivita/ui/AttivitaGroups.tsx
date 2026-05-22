import { Link } from "react-router-dom";
import type { Attivita } from "@vet/shared";
import { EmptyState } from "../../../shared/ui";
import { attivitaI18n as t } from "../i18n";
import { formatEuro } from "../lib/format";
import type { Group } from "../lib/totals";
import { AttivitaRow } from "./AttivitaRow";

interface AttivitaGroupsProps {
  isLoading: boolean;
  isError: boolean;
  items: Attivita[];
  groups: Group[];
  canCreate: boolean;
  filtersActive: boolean;
}

export function AttivitaGroups({
  isLoading,
  isError,
  items,
  groups,
  canCreate,
  filtersActive,
}: AttivitaGroupsProps) {
  if (isLoading) {
    return <p className="text-sm text-(--color-text-muted)">{t.loading}</p>;
  }
  if (isError) {
    return <p className="text-sm text-(--color-danger)">{t.loadError}</p>;
  }
  if (items.length === 0) {
    return <EmptyAttivita filtered={filtersActive} canCreate={canCreate} />;
  }
  return (
    <div className="space-y-8">
      {groups.map((g) => (
        <GroupSection key={g.key} group={g} />
      ))}
    </div>
  );
}

function GroupSection({ group }: { group: Group }) {
  return (
    <section>
      {group.label ? (
        <header className="flex items-baseline justify-between mb-2 px-1">
          <h2 className="text-sm font-medium text-(--color-text)">
            {group.label}
          </h2>
          <span className="text-sm text-(--color-text-muted) tabular-nums">
            {formatEuro(group.totale)}
          </span>
        </header>
      ) : null}
      <ul className="bg-(--color-surface) border border-(--color-border) rounded-2xl overflow-hidden divide-y divide-(--color-border)">
        {group.items.map((a) => (
          <li key={a.id}>
            <AttivitaRow attivita={a} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function EmptyAttivita({
  filtered,
  canCreate,
}: {
  filtered: boolean;
  canCreate: boolean;
}) {
  if (filtered) return <EmptyState title={t.emptyFiltered} />;
  if (!canCreate) return <EmptyState title={t.emptyAll} />;
  return (
    <EmptyState
      title={t.emptyAll}
      action={
        <Link
          to="/attivita/nuova"
          className="text-sm text-(--color-accent) hover:underline"
        >
          {t.nuovaAttivita}
        </Link>
      }
    />
  );
}
