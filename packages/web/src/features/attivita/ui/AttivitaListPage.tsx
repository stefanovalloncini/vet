import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AppShell,
  BoxedList,
  Button,
  EmptyState,
  InlineError,
  LoadingHint,
  PageHeader,
} from "../../../shared/ui";
import { useAuthState } from "../../auth";
import { useAttivita } from "../hooks/useAttivita";
import { useReferenceData } from "../hooks/useReferenceData";
import { attivitaI18n as t } from "../i18n";
import { computeTotals, groupAttivita, type GroupKey } from "../lib/totals";
import { formatEuro, parseDateInput } from "../lib/format";
import { AttivitaRow } from "./AttivitaRow";
import { AttivitaTotalsBar } from "./AttivitaTotalsBar";
import {
  AttivitaFilterBar,
  AttivitaQuickRanges,
} from "./AttivitaFilterBar";
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

  const mineOnly = params.get("mine") === "1";

  const filters = useMemo(() => {
    const f: {
      from?: Date;
      to?: Date;
      aziendaId?: string;
      tipoId?: string;
      ownerUid?: string;
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
    if (mineOnly && user) f.ownerUid = user.uid;
    return f;
  }, [from, to, aziendaId, tipoId, mineOnly, user]);

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
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        actions={
          <>
            <label className="flex items-center gap-2 text-xs text-(--color-text-muted) cursor-pointer mr-2">
              <input
                type="checkbox"
                checked={mineOnly}
                onChange={(e) => setParam("mine", e.target.checked ? "1" : "")}
                className="w-4 h-4 accent-(--color-accent)"
              />
              Solo mie
            </label>
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
          </>
        }
      />

      <AttivitaQuickRanges from={from} to={to} onChange={setParam} />

      <AttivitaFilterBar
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

      <AttivitaTotalsBar totals={totals} />

      {loading ? (
        <LoadingHint label={t.loading} />
      ) : error ? (
        <InlineError>{t.loadError}</InlineError>
      ) : items.length === 0 ? (
        renderEmpty(Object.keys(filters).length > 0, canCreate)
      ) : (
        <div className="space-y-8">
          {groups.map((g) => (
            <section key={g.key}>
              {g.label ? (
                <header className="flex items-baseline justify-between mb-2 px-1">
                  <h2 className="text-sm font-medium text-(--color-text)">
                    {g.label}
                  </h2>
                  <span className="text-sm text-(--color-text-muted) tabular-nums">
                    {formatEuro(g.totale)}
                  </span>
                </header>
              ) : null}
              <BoxedList>
                {g.items.map((a) => (
                  <li key={a.id}>
                    <AttivitaRow attivita={a} />
                  </li>
                ))}
              </BoxedList>
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

function renderEmpty(filtered: boolean, canCreate: boolean) {
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
