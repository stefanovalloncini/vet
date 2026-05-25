import { useId, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { Azienda } from "@vet/shared";
import {
  AppShell,
  Badge,
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

  const counters = useMemo(
    () => computeCounters(aziende ?? [], grouped),
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
    <AppShell>
      <PageHeader title={t.title} subtitle={t.subtitle} />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Toggle
          checked={onlyUnsaldati}
          onChange={setOnlyUnsaldati}
          label={t.mostraSoloNonSaldati}
        />
        {counters.total > 0 ? (
          <p className="text-xs text-(--color-text-muted) tabular-nums">
            {t.counterPending(counters.pending, counters.total)}
          </p>
        ) : null}
      </div>

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

interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}

function Toggle({ checked, onChange, label }: ToggleProps) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className="inline-flex items-center gap-3 text-sm text-(--color-text) cursor-pointer select-none"
    >
      <span className="relative inline-flex h-6 w-10 items-center">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-label={label}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className={[
            "absolute inset-0 rounded-full transition-colors duration-(--motion-fast) ease-(--ease-out-quart)",
            "bg-(--color-surface-muted) border border-(--color-border)",
            "peer-checked:bg-(--color-accent) peer-checked:border-(--color-accent)",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-(--color-accent) peer-focus-visible:ring-offset-2",
          ].join(" ")}
        />
        <span
          aria-hidden="true"
          className={[
            "relative ml-0.5 h-5 w-5 rounded-full bg-(--color-surface)",
            "shadow-[0_1px_2px_oklch(20%_0.012_240/0.18)]",
            "transition-transform duration-(--motion-fast) ease-(--ease-out-quart)",
            checked ? "translate-x-4" : "translate-x-0",
          ].join(" ")}
        />
      </span>
      <span>{label}</span>
    </label>
  );
}

interface Counters {
  pending: number;
  total: number;
}

function computeCounters(
  aziende: ReadonlyArray<Azienda>,
  grouped: ContiByAziendaMap
): Counters {
  let pending = 0;
  let total = 0;
  for (const azienda of aziende) {
    const bucket = grouped.get(azienda.id);
    if (!bucket) continue;
    total += 1;
    if (bucket.hasUnsaldati) pending += 1;
  }
  return { pending, total };
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
    <Link to={`/aziende/${azienda.id}`} className="block group">
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
            <p className="text-xs text-(--color-text-subtle) mt-0.5">
              {t.ultimoConto}: {formatDate(bucket.lastEmittedAt)}
            </p>
          </div>
          <RowAmount bucket={bucket} />
          <ChevronRight
            size={16}
            strokeWidth={1.75}
            className="text-(--color-text-subtle) flex-shrink-0"
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
      <Badge tone="success" size="sm">
        {t.tuttiSaldati}
      </Badge>
    );
  }
  return (
    <div className="flex flex-col items-end gap-1 flex-shrink-0">
      <span className="font-mono text-base font-medium text-(--color-danger) tabular-nums">
        {formatEuro(bucket.totaleUnsaldati)}
      </span>
      <span className="text-[11px] text-(--color-text-muted) tabular-nums">
        {bucket.unsaldatiCount} {t.contiNonSaldatiSuffix}
      </span>
    </div>
  );
}
