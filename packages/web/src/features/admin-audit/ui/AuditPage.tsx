import { useMemo, useState } from "react";
import {
  AdminLayout,
  EmptyState,
  PageHeader,
  Select,
  TextField,
} from "../../../shared/ui";
import {
  DataGrid,
  dataGridIt,
  type Column,
  type GroupingDef,
} from "../../../shared/ui/data-grid";
import { useAuditEvents } from "../hooks/useAuditEvents";
import { ACTION_LABELS, auditI18n as t } from "../i18n";
import type { AuditAction, AuditEvent, AuditFilters } from "@vet/shared";

type TargetType = NonNullable<AuditFilters["targetType"]>;

const TARGET_TYPES: Array<{ value: TargetType | ""; label: string }> = [
  { value: "", label: t.filtroTutti },
  { value: "role", label: "Ruolo" },
  { value: "user", label: "Utente" },
  { value: "attivita", label: "Attività" },
  { value: "azienda", label: "Azienda" },
  { value: "allowlist", label: "Allowlist" },
  { value: "activity_type", label: "Tipo attività" },
  { value: "access_request", label: "Richiesta accesso" },
];

const ACTIONS: Array<{ value: AuditAction | ""; label: string }> = [
  { value: "", label: t.filtroTutti },
  ...(Object.entries(ACTION_LABELS) as Array<[AuditAction, string]>).map(
    ([v, label]) => ({ value: v, label })
  ),
];

const DAY_LABEL_FMT = new Intl.DateTimeFormat("it-IT", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

function parseDate(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function AuditRow({ event }: { event: AuditEvent }) {
  const actor = event.actorEmail || event.actorUid;
  return (
    <div className="bg-(--color-surface) border border-(--color-border) rounded-2xl px-4 py-3">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 sm:gap-4 sm:grid-cols-[5ch_minmax(0,2fr)_minmax(0,1fr)]">
        <span className="text-xs text-(--color-text-muted) font-mono tabular-nums shrink-0 pt-0.5">
          {event.at.toLocaleTimeString("it-IT", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        <div className="min-w-0">
          <p className="text-sm text-(--color-text) leading-snug">
            {ACTION_LABELS[event.action] ?? event.action}
          </p>
          <p className="text-[11px] text-(--color-text-subtle) mt-0.5 font-mono truncate">
            {event.targetType}/{event.targetId}
          </p>
          <p className="sm:hidden text-[11px] text-(--color-text-muted) font-mono truncate mt-0.5">
            {actor}
          </p>
        </div>
        <p className="hidden sm:block text-xs text-(--color-text-muted) font-mono truncate">
          {actor}
        </p>
        {event.details ? (
          <details className="col-start-2 sm:col-span-2 mt-1">
            <summary className="text-[11px] text-(--color-text-subtle) cursor-pointer hover:text-(--color-text-muted)">
              {t.dettagli}
            </summary>
            <pre className="text-[11px] text-(--color-text-subtle) mt-2 overflow-x-auto whitespace-pre-wrap bg-(--color-surface-muted) rounded-md p-2 font-mono">
              {JSON.stringify(event.details, null, 0)}
            </pre>
          </details>
        ) : null}
      </div>
    </div>
  );
}

export function AuditPage() {
  const [filterAction, setFilterAction] = useState<AuditAction | "">("");
  const [filterTarget, setFilterTarget] = useState<TargetType | "">("");
  const [filterActor, setFilterActor] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const filters: AuditFilters = {
    ...(filterAction ? { action: filterAction } : {}),
    ...(filterTarget ? { targetType: filterTarget } : {}),
  };
  const { data, isLoading, isError } = useAuditEvents(filters);

  const events = useMemo(() => {
    const raw = data ?? [];
    const actorTerm = filterActor.trim().toLowerCase();
    const from = parseDate(filterFrom);
    const to = parseDate(filterTo);
    const toEnd = to ? new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999) : null;
    return raw.filter((e) => {
      if (actorTerm && !e.actorEmail.toLowerCase().includes(actorTerm)) return false;
      if (from && e.at < from) return false;
      if (toEnd && e.at > toEnd) return false;
      return true;
    });
  }, [data, filterActor, filterFrom, filterTo]);

  const columns = useMemo<ReadonlyArray<Column<AuditEvent>>>(
    () => [
      {
        id: "at",
        header: t.quando,
        accessor: (e) => e.at.getTime(),
        sortable: true,
      },
    ],
    []
  );

  const byDay: GroupingDef<AuditEvent> = {
    keyOf: (e) => e.at.toISOString().slice(0, 10),
    labelOf: (key) => DAY_LABEL_FMT.format(new Date(`${key}T00:00:00`)),
  };

  return (
    <AdminLayout>
      <PageHeader title={t.title} subtitle={t.subtitle} />

      <section
        aria-label={t.filtroAttore}
        className="border border-(--color-border) rounded-xl p-4 mb-6 bg-(--color-surface)"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <TextField
            id="filter-actor"
            label={t.filtroAttore}
            value={filterActor}
            onChange={(e) => setFilterActor(e.target.value)}
            placeholder="es. mario.rossi@vet.it"
            autoComplete="off"
          />
          <TextField
            id="filter-from"
            type="date"
            label={t.filtroDal}
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
          />
          <TextField
            id="filter-to"
            type="date"
            label={t.filtroAl}
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
          />
          <Select
            id="filter-action"
            label={t.filtroAzione}
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value as AuditAction | "")}
            options={ACTIONS}
          />
          <Select
            id="filter-target"
            label={t.filtroTarget}
            value={filterTarget}
            onChange={(e) => setFilterTarget(e.target.value as TargetType | "")}
            options={TARGET_TYPES}
          />
        </div>
      </section>

      <DataGrid<AuditEvent>
        rows={events}
        columns={columns}
        getRowId={(e) => e.id}
        mode="cards"
        i18n={dataGridIt}
        loading={isLoading}
        error={isError ? t.loadError : null}
        rowActions={[]}
        groupBy={byDay}
        defaultSort={{ columnId: "at", direction: "desc" }}
        emptyState={<EmptyState title={t.empty} />}
        card={(event) => <AuditRow event={event} />}
      />
    </AdminLayout>
  );
}
