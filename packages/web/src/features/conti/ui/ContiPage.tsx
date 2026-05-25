import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { Azienda } from "@vet/shared";
import {
  AppShell,
  Card,
  EmptyState,
  InlineError,
  LoadingHint,
  PageHeader,
} from "../../../shared/ui";
import { formatDate, formatEuro } from "../../../shared/lib/format";
import { useAziende } from "../../aziende/hooks/useAziende";
import { useConti } from "../hooks/useConti";
import {
  groupContiByAzienda,
  type ContiByAzienda,
  type ContiByAziendaMap,
} from "../lib/groupContiByAzienda";
import { contiI18n as t } from "../i18n";

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

  const rows = useMemo(
    () => buildRows(aziende ?? [], grouped, onlyUnsaldati),
    [aziende, grouped, onlyUnsaldati]
  );

  const isPending = aziendePending || contiPending;
  const isError = aziendeError || contiError;
  const noContiAtAll = grouped.size === 0;

  return (
    <AppShell>
      <PageHeader title={t.title} subtitle={t.subtitle} />
      <label className="flex items-center gap-2 text-sm text-(--color-text-muted) mb-4 cursor-pointer">
        <input
          type="checkbox"
          checked={onlyUnsaldati}
          onChange={(e) => setOnlyUnsaldati(e.target.checked)}
          className="w-4 h-4 accent-(--color-accent)"
        />
        {t.mostraSoloNonSaldati}
      </label>

      {isPending ? (
        <LoadingHint label="Caricamento…" />
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
  return (
    <Link to={`/aziende/${azienda.id}`} className="block">
      <Card className="hover:bg-(--color-surface-muted) transition-colors">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                title={
                  bucket.hasUnsaldati
                    ? "Ci sono conti non saldati"
                    : "Tutti i conti saldati"
                }
                className={[
                  "w-2 h-2 rounded-full flex-shrink-0",
                  bucket.hasUnsaldati
                    ? "bg-(--color-danger)"
                    : "bg-(--color-success)",
                ].join(" ")}
              />
              <h2 className="text-base font-medium text-(--color-text) truncate">
                {azienda.nome}
              </h2>
            </div>
            <p className="text-xs text-(--color-text-subtle) mt-1">
              {t.ultimoConto}: {formatDate(bucket.lastEmittedAt)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <StatusPill bucket={bucket} />
            <ChevronRight
              size={16}
              strokeWidth={1.75}
              className="text-(--color-text-subtle)"
              aria-hidden="true"
            />
          </div>
        </div>
      </Card>
    </Link>
  );
}

function StatusPill({ bucket }: { bucket: ContiByAzienda }) {
  if (!bucket.hasUnsaldati) {
    return (
      <span className="px-2 py-0.5 rounded-md text-xs bg-(--color-accent-soft) text-(--color-text)">
        {t.tuttiSaldati}
      </span>
    );
  }
  const label = `${bucket.unsaldatiCount} ${t.contiNonSaldatiSuffix} · ${formatEuro(bucket.totaleUnsaldati)}`;
  return (
    <span className="px-2 py-0.5 rounded-md text-xs bg-(--color-danger)/10 text-(--color-danger) tabular-nums">
      {label}
    </span>
  );
}
