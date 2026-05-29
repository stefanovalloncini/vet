import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { Azienda } from "@vet/shared";
import {
  AppShell,
  Badge,
  Card,
  EmptyState,
  InlineError,
  ListSkeleton,
  PageHeader,
  Switch,
} from "../../../shared/ui";
import { formatDate, formatEuro } from "../../../shared/lib/format";
import { useAziende } from "../../aziende/hooks/useAziende";
import { useConti } from "../hooks/useConti";
import {
  computeContiCounters,
  groupContiByAzienda,
  type ContiByAzienda,
  type ContiByAziendaMap,
} from "../lib/groupContiByAzienda";
import { contiI18n as t } from "../i18n";
import { routes } from "../../../routes";

export function ContiPage() {
  const {
    data: aziende,
    isPending: aziendePending,
    isError: aziendeError,
  } = useAziende();
  const {
    data: conti,
    isPending: contiPending,
    isError: contiError,
  } = useConti();
  const [onlyUnsaldati, setOnlyUnsaldati] = useState(true);

  const grouped = useMemo(
    () => groupContiByAzienda(conti ?? []),
    [conti]
  );

  const counters = useMemo(
    () => computeContiCounters(aziende ?? [], grouped),
    [aziende, grouped]
  );

  const rows = useMemo(
    () => buildRows(aziende ?? [], grouped, onlyUnsaldati),
    [aziende, grouped, onlyUnsaldati]
  );

  const isPending = aziendePending || contiPending;
  const isError = aziendeError || contiError;
  const noContiAtAll = grouped.size === 0;

  return (
    <AppShell wide>
      <PageHeader title={t.title} subtitle={t.subtitle} />

      {counters.totaleUnsaldati > 0 ? (
        <div
          role="status"
          aria-live="polite"
          className="mb-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 rounded-2xl border border-(--color-danger)/30 bg-(--color-danger)/5 px-4 py-3"
        >
          <span className="text-xs uppercase tracking-wider text-(--color-text-muted)">
            {t.totaleDaRiscuotere}
          </span>
          <span className="font-mono text-xl font-semibold text-(--color-danger) tabular-nums whitespace-nowrap">
            {formatEuro(counters.totaleUnsaldati)}
          </span>
        </div>
      ) : null}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Switch
          checked={onlyUnsaldati}
          onChange={setOnlyUnsaldati}
          label={t.mostraSoloNonSaldati}
        />
        {counters.total > 0 ? (
          <p
            aria-live="polite"
            className="text-xs text-(--color-text-muted) tabular-nums"
          >
            {t.counterPending(counters.pending, counters.total)}
          </p>
        ) : null}
      </div>

      {isPending ? (
        <ListSkeleton count={4} />
      ) : isError ? (
        <InlineError>{t.loadError}</InlineError>
      ) : noContiAtAll ? (
        <EmptyState title={t.emptyAll} />
      ) : rows.length === 0 ? (
        <EmptyState title={t.emptyFiltered} />
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.azienda.id}>
              <AziendaRow azienda={row.azienda} bucket={row.bucket} />
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}


interface Row {
  readonly azienda: Azienda;
  readonly bucket: ContiByAzienda;
}

function buildRows(
  aziende: ReadonlyArray<Azienda>,
  grouped: ContiByAziendaMap,
  onlyUnsaldati: boolean
): ReadonlyArray<Row> {
  const rows: Row[] = [];
  for (const azienda of aziende) {
    const bucket = grouped.get(azienda.id);
    if (!bucket) continue;
    if (onlyUnsaldati && !bucket.hasUnsaldati) continue;
    rows.push({ azienda, bucket });
  }
  return rows.sort((a, b) =>
    a.azienda.nomeNorm.localeCompare(b.azienda.nomeNorm, "it")
  );
}

interface AziendaRowProps {
  azienda: Azienda;
  bucket: ContiByAzienda;
}

function AziendaRow({ azienda, bucket }: AziendaRowProps) {
  const dotLabel = bucket.hasUnsaldati
    ? "Ci sono conti non saldati"
    : "Tutti i conti saldati";
  return (
    <Link to={`${routes.aziendaDetail.to({ id: azienda.id })}?tab=conti`} className="block group">
      <Card className="transition-colors duration-(--motion-fast) ease-(--ease-out-quart) group-hover:border-(--color-border-strong)">
        <div className="flex items-center gap-4">
          <span
            title={dotLabel}
            aria-label={dotLabel}
            role="img"
            className="flex-shrink-0"
          >
            <Badge tone={bucket.hasUnsaldati ? "danger" : "success"} dot />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-medium text-(--color-text) truncate">
              {azienda.nome}
            </h2>
            <p className="text-xs text-(--color-text-subtle) mt-0.5 truncate">
              {t.ultimoConto}: {formatDate(bucket.lastEmittedAt)}
            </p>
          </div>
          <RowAmount bucket={bucket} />
          <ChevronRight
            size={16}
            strokeWidth={1.75}
            className="text-(--color-text-subtle) shrink-0"
            aria-hidden="true"
          />
        </div>
      </Card>
    </Link>
  );
}

function RowAmount({ bucket }: { bucket: ContiByAzienda }) {
  if (!bucket.hasUnsaldati) {
    return (
      <span className="shrink-0">
        <Badge tone="success" size="sm">
          {t.tuttiSaldati}
        </Badge>
      </span>
    );
  }
  return (
    <div className="flex flex-col items-end gap-0.5 shrink-0">
      <span className="font-mono text-base font-medium text-(--color-danger) tabular-nums">
        {formatEuro(bucket.totaleUnsaldati)}
      </span>
      <span className="text-[11px] text-(--color-text-muted) tabular-nums">
        {bucket.unsaldatiCount} {t.contiNonSaldatiSuffix}
      </span>
    </div>
  );
}
