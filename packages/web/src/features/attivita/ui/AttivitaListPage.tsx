import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell, Button } from "../../../shared/ui";
import { useAuthState } from "../../auth";
import { useAttivita } from "../hooks/useAttivita";
import { useAttivitaFilters } from "../hooks/useAttivitaFilters";
import { useReferenceData } from "../hooks/useReferenceData";
import { attivitaI18n as t } from "../i18n";
import { computeTotals, groupAttivita } from "../lib/totals";
import { AttivitaTotalsBar } from "./AttivitaTotalsBar";
import { AttivitaFilterBar, AttivitaQuickRanges } from "./AttivitaFilterBar";
import { AttivitaGroups } from "./AttivitaGroups";
import { ExportDialog } from "./ExportDialog";

const groupOptions = [
  { value: "none", label: t.raggruppaNessuno },
  { value: "azienda", label: t.raggruppaAzienda },
  { value: "giorno", label: t.raggruppaGiorno },
  { value: "vet", label: t.raggruppaVet },
];

export function AttivitaListPage() {
  const { user } = useAuthState();
  const ref = useReferenceData();
  const [showExport, setShowExport] = useState(false);
  const fs = useAttivitaFilters({ ownerUid: user?.uid });
  const { items, loading, error } = useAttivita(fs.filters);

  const totals = useMemo(() => computeTotals(items), [items]);
  const groups = useMemo(() => groupAttivita(items, fs.group), [items, fs.group]);

  const canCreate = user?.caps.has("activities.create") ?? false;
  const canExport = user?.caps.has("activities.export") ?? false;

  const aziendaOptions = useMemo(
    () => [
      { value: "", label: t.filtroTutti },
      ...ref.aziende.map((a) => ({ value: a.id, label: a.nome })),
    ],
    [ref.aziende]
  );
  const tipoOptions = useMemo(
    () => [
      { value: "", label: t.filtroTutti },
      ...ref.tipi.map((tipo) => ({ value: tipo.id, label: tipo.nome })),
    ],
    [ref.tipi]
  );

  return (
    <AppShell>
      <ListHeader
        mineOnly={fs.mineOnly}
        canCreate={canCreate}
        canExport={canExport}
        onToggleMine={(v) => fs.setParam("mine", v ? "1" : "")}
        onExport={() => setShowExport(true)}
      />
      <AttivitaQuickRanges from={fs.from} to={fs.to} onChange={fs.setParam} />
      <AttivitaFilterBar
        from={fs.from}
        to={fs.to}
        aziendaId={fs.aziendaId}
        tipoId={fs.tipoId}
        group={fs.group}
        aziendaOptions={aziendaOptions}
        tipoOptions={tipoOptions}
        groupOptions={groupOptions}
        onChange={fs.setParam}
      />
      <AttivitaTotalsBar totals={totals} />
      <AttivitaGroups
        loading={loading}
        error={error}
        items={items}
        groups={groups}
        canCreate={canCreate}
        filtersActive={Object.keys(fs.filters).length > 0}
      />
      {showExport ? <ExportDialog onClose={() => setShowExport(false)} /> : null}
    </AppShell>
  );
}

interface ListHeaderProps {
  mineOnly: boolean;
  canCreate: boolean;
  canExport: boolean;
  onToggleMine: (next: boolean) => void;
  onExport: () => void;
}

function ListHeader({ mineOnly, canCreate, canExport, onToggleMine, onExport }: ListHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-medium tracking-tight text-(--color-text)">{t.title}</h1>
        <p className="text-(--color-text-muted) mt-2 text-sm">{t.subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-xs text-(--color-text-muted) cursor-pointer mr-2">
          <input
            type="checkbox"
            checked={mineOnly}
            onChange={(e) => onToggleMine(e.target.checked)}
            className="w-4 h-4 accent-(--color-accent)"
          />
          Solo mie
        </label>
        {canExport ? (
          <Button type="button" variant="secondary" onClick={onExport}>
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
  );
}
