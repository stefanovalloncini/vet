import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AppShell,
  Button,
  Card,
  Select,
  TextField,
} from "../../../shared/ui";
import { useAuthState } from "../../auth";
import { useAttivita } from "../hooks/useAttivita";
import { useReferenceData } from "../hooks/useReferenceData";
import { attivitaI18n as t } from "../i18n";
import type { Attivita } from "@vet/shared";
import { computeTotals, groupAttivita, type GroupKey } from "../lib/totals";
import { formatDate, formatEuro, parseDateInput } from "../lib/format";
import { ExportDialog } from "./ExportDialog";

export function AttivitaListPage() {
  const { user } = useAuthState();
  const ref = useReferenceData();
  const [params, setParams] = useSearchParams();
  const [showExport, setShowExport] = useState(false);

  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const aziendaId = params.get("azienda") ?? "";
  const tipoId = params.get("tipo") ?? "";
  const group: GroupKey =
    (params.get("group") as GroupKey | null) === "azienda"
      ? "azienda"
      : params.get("group") === "giorno"
      ? "giorno"
      : params.get("group") === "vet"
      ? "vet"
      : "none";

  const filters = useMemo(() => {
    const f: {
      from?: Date;
      to?: Date;
      aziendaId?: string;
      tipoId?: string;
    } = {};
    const fromDate = parseDateInput(from);
    const toDate = parseDateInput(to);
    if (fromDate) f.from = fromDate;
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      f.to = end;
    }
    if (aziendaId) f.aziendaId = aziendaId;
    if (tipoId) f.tipoId = tipoId;
    return f;
  }, [from, to, aziendaId, tipoId]);

  const { items, loading, error } = useAttivita(filters);

  const totals = useMemo(() => computeTotals(items), [items]);
  const groups = useMemo(() => groupAttivita(items, group), [items, group]);

  const canCreate = user?.caps.has("activities.create") ?? false;
  const canExport = user?.caps.has("activities.export") ?? false;

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  const aziendaOptions = [
    { value: "", label: t.filtroTutti },
    ...ref.aziende.map((a) => ({ value: a.id, label: a.nome })),
  ];
  const tipoOptions = [
    { value: "", label: t.filtroTutti },
    ...ref.tipi.map((tipo) => ({ value: tipo.id, label: tipo.nome })),
  ];
  const groupOptions = [
    { value: "none", label: t.raggruppaNessuno },
    { value: "azienda", label: t.raggruppaAzienda },
    { value: "giorno", label: t.raggruppaGiorno },
    { value: "vet", label: t.raggruppaVet },
  ];

  return (
    <AppShell>
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-(--color-text)">
            {t.title}
          </h1>
          <p className="text-(--color-text-muted) mt-2 text-sm">
            {t.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canExport ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowExport(true)}
            >
              {t.esporta}
            </Button>
          ) : null}
          {canCreate ? (
            <Link to="/attivita/nuova">
              <Button type="button" variant="primary">
                {t.nuovaAttivita}
              </Button>
            </Link>
          ) : null}
        </div>
      </header>

      <FilterBar
        from={from}
        to={to}
        aziendaId={aziendaId}
        tipoId={tipoId}
        group={group}
        aziendaOptions={aziendaOptions}
        tipoOptions={tipoOptions}
        groupOptions={groupOptions}
        onChange={setParam}
      />

      <TotalsBar totals={totals} />

      {loading ? (
        <p className="text-sm text-(--color-text-muted)">{t.loading}</p>
      ) : error ? (
        <p className="text-sm text-(--color-danger)">{t.loadError}</p>
      ) : items.length === 0 ? (
        <Card>
          <p className="text-sm text-(--color-text-muted) text-center py-4">
            {Object.keys(filters).length > 0 ? t.emptyFiltered : t.emptyAll}
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.key}>
              {g.label ? (
                <header className="flex items-baseline justify-between mb-3 px-1">
                  <h2 className="text-sm font-medium text-(--color-text)">
                    {g.label}
                  </h2>
                  <span className="text-sm text-(--color-text-muted) tabular-nums">
                    {formatEuro(g.totale)}
                  </span>
                </header>
              ) : null}
              <ul className="space-y-2">
                {g.items.map((a) => (
                  <li key={a.id}>
                    <AttivitaRow attivita={a} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {showExport ? (
        <ExportDialog onClose={() => setShowExport(false)} />
      ) : null}
    </AppShell>
  );
}

function FilterBar(props: {
  from: string;
  to: string;
  aziendaId: string;
  tipoId: string;
  group: GroupKey;
  aziendaOptions: ReadonlyArray<{ value: string; label: string }>;
  tipoOptions: ReadonlyArray<{ value: string; label: string }>;
  groupOptions: ReadonlyArray<{ value: string; label: string }>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <Card className="mb-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <TextField
          id="from"
          type="date"
          label={t.filtroDataDa}
          value={props.from}
          onChange={(e) => props.onChange("from", e.target.value)}
        />
        <TextField
          id="to"
          type="date"
          label={t.filtroDataA}
          value={props.to}
          onChange={(e) => props.onChange("to", e.target.value)}
        />
        <Select
          id="filtro-azienda"
          label={t.filtroAzienda}
          value={props.aziendaId}
          options={props.aziendaOptions}
          onChange={(e) => props.onChange("azienda", e.target.value)}
        />
        <Select
          id="filtro-tipo"
          label={t.filtroTipo}
          value={props.tipoId}
          options={props.tipoOptions}
          onChange={(e) => props.onChange("tipo", e.target.value)}
        />
        <Select
          id="raggruppa"
          label={t.raggruppa}
          value={props.group}
          options={props.groupOptions}
          onChange={(e) => props.onChange("group", e.target.value)}
        />
      </div>
    </Card>
  );
}

function TotalsBar({ totals }: { totals: ReturnType<typeof computeTotals> }) {
  return (
    <Card className="mb-6">
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        <Stat label={t.totaleRecord} value={String(totals.count)} />
        <Stat label={t.totaleAziende} value={String(totals.aziende)} />
        <Stat label={t.totaleVet} value={String(totals.vets)} />
        <Stat label={t.totaleFatturato} value={formatEuro(totals.totale)} highlight />
      </dl>
    </Card>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-(--color-text-muted) mb-1">
        {label}
      </dt>
      <dd
        className={[
          "tabular-nums",
          highlight ? "text-2xl font-medium text-(--color-text)" : "text-lg text-(--color-text)",
        ].join(" ")}
      >
        {value}
      </dd>
    </div>
  );
}

function AttivitaRow({ attivita: a }: { attivita: Attivita }) {
  return (
    <Link to={`/attivita/${a.id}`} className="block">
      <Card className="hover:border-(--color-border-strong) transition-colors">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-sm text-(--color-text-muted) tabular-nums">
                {formatDate(a.data)}
              </span>
              <h2 className="text-base font-medium text-(--color-text) truncate">
                {a.aziendaNome}
              </h2>
              <span className="text-sm text-(--color-text-muted)">
                {a.tipoNome}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-(--color-text-subtle)">
              <span>{a.ownerName}</span>
              {a.oraria && a.ore !== undefined ? (
                <span>
                  {formatEuro(a.tariffa)}/h × {a.ore}h
                </span>
              ) : null}
              {a.note ? <span className="truncate">{a.note}</span> : null}
            </div>
          </div>
          <span className="text-base font-medium text-(--color-text) tabular-nums flex-shrink-0">
            {formatEuro(a.totale)}
          </span>
        </div>
      </Card>
    </Link>
  );
}
