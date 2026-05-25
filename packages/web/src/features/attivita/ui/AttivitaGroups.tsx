import type { Attivita } from "@vet/shared";
import { Button, EmptyState } from "../../../shared/ui";
import { useAuthState } from "../../auth";
import { openQuickEntry } from "../../quick-entry";
import { attivitaI18n as t } from "../i18n";
import { formatEuro } from "../../../shared/lib/format";
import type { Group } from "../lib/totals";
import { AttivitaRow } from "./AttivitaRow";
import { AttivitaTableFlat, AttivitaTableGrouped } from "./AttivitaTable";

interface AttivitaGroupsProps {
  isLoading: boolean;
  isError: boolean;
  items: Attivita[];
  groups: Group[];
  filtersActive: boolean;
  onClearFilters?: () => void;
}

export function AttivitaGroups({
  isLoading,
  isError,
  items,
  groups,
  filtersActive,
  onClearFilters,
}: AttivitaGroupsProps) {
  if (isLoading) {
    return <p className="text-sm text-(--color-text-muted)">{t.loading}</p>;
  }
  if (isError) {
    return <p className="text-sm text-(--color-danger)">{t.loadError}</p>;
  }
  if (items.length === 0) {
    return (
      <EmptyAttivita
        filtered={filtersActive}
        {...(onClearFilters ? { onClearFilters } : {})}
      />
    );
  }
  const grouped = groups.length > 1 || (groups[0]?.label ?? "") !== "";
  return (
    <>
      <div className="hidden md:block">
        {grouped ? (
          <AttivitaTableGrouped groups={groups} />
        ) : (
          <AttivitaTableFlat items={items} />
        )}
      </div>
      <MobileList groups={groups} grouped={grouped} />
    </>
  );
}

function MobileList({ groups, grouped }: { groups: Group[]; grouped: boolean }) {
  return (
    <div className={`md:hidden ${grouped ? "space-y-6" : ""}`}>
      {groups.map((g) => (
        <section key={g.key}>
          {grouped ? (
            <header className="flex items-baseline justify-between mb-2 pb-1.5 border-b border-(--color-border)">
              <h2 className="text-sm font-semibold text-(--color-text)">
                {g.label}
              </h2>
              <span className="text-sm font-semibold text-(--color-text) tabular-nums">
                {formatEuro(g.totale)}
              </span>
            </header>
          ) : null}
          <ul className="bg-(--color-surface) border border-(--color-border) rounded-2xl overflow-hidden divide-y divide-(--color-border)">
            {g.items.map((a) => (
              <li key={a.id}>
                <AttivitaRow attivita={a} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function EmptyAttivita({
  filtered,
  onClearFilters,
}: {
  filtered: boolean;
  onClearFilters?: () => void;
}) {
  const { user } = useAuthState();
  const canCreate = user?.caps.has("activities.create") ?? false;
  if (filtered) {
    return (
      <EmptyState
        title={t.emptyFiltered}
        description={t.emptyFilteredHint}
        {...(onClearFilters
          ? {
              action: (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClearFilters}
                >
                  {t.pulisciFiltri}
                </Button>
              ),
            }
          : {})}
      />
    );
  }
  if (!canCreate) return <EmptyState title={t.emptyAll} />;
  return (
    <EmptyState
      title={t.emptyAll}
      action={
        <Button type="button" variant="primary" onClick={openQuickEntry}>
          {t.emptyAllCta}
        </Button>
      }
    />
  );
}
