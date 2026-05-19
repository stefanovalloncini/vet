import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AppShell, Button, EmptyState } from "../../../shared/ui";
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
        </div>
      </header>

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
        <p className="text-sm text-(--color-text-muted)">{t.loading}</p>
      ) : error ? (
        <p className="text-sm text-(--color-danger)">{t.loadError}</p>
      ) : items.length === 0 ? (
        <EmptyState
          title={
            Object.keys(filters).length > 0 ? t.emptyFiltered : t.emptyAll
          }
        />
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
