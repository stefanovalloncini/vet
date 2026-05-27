import { useMemo, useState } from "react";
import { AppShell, PageHeader } from "../../../shared/ui";
import { withAllOption } from "../../../shared/lib/options";
import { useAuthState } from "../../auth";
import { useAttivita } from "../hooks/useAttivita";
import { useAttivitaFilters } from "../hooks/useAttivitaFilters";
import { useReferenceData } from "../hooks/useReferenceData";
import { useVetOptions } from "../hooks/useVetOptions";
import { attivitaI18n as t } from "../i18n";
import { computeTotals } from "../lib/totals";
import { AttivitaTotalsBar } from "./AttivitaTotalsBar";
import { AttivitaFilterBar } from "./AttivitaFilterBar";
import { AttivitaViewToolbar } from "./AttivitaViewToolbar";
import { AttivitaDataGrid } from "./AttivitaDataGrid";
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
  const vets = useVetOptions();
  const [showExport, setShowExport] = useState(false);
  const fs = useAttivitaFilters();
  const attivitaQuery = useAttivita(fs.filters);
  const items = attivitaQuery.items;

  const totals = useMemo(() => computeTotals(items), [items]);

  const canExport = user?.caps.has("activities.export") ?? false;

  const aziendaOptions = useMemo(
    () =>
      withAllOption(
        ref.aziende.map((a) => ({ value: a.id, label: a.nome })),
        t.filtroTutti
      ),
    [ref.aziende]
  );
  const tipoOptions = useMemo(
    () =>
      withAllOption(
        ref.tipi.map((tipo) => ({ value: tipo.id, label: tipo.nome })),
        t.filtroTutti
      ),
    [ref.tipi]
  );
  const vetOptions = useMemo(
    () =>
      withAllOption(
        vets.map((v) => ({ value: v.uid, label: v.nome })),
        t.filtroTutti
      ),
    [vets]
  );

  return (
    <AppShell>
      <PageHeader title={t.title} subtitle={t.subtitle} />
      <AttivitaFilterBar
        from={fs.from}
        to={fs.to}
        aziendaId={fs.aziendaId}
        tipoId={fs.tipoId}
        vetUid={fs.vetUid}
        aziendaOptions={aziendaOptions}
        tipoOptions={tipoOptions}
        vetOptions={vetOptions}
        onChange={fs.setParam}
        onClearAll={fs.clearAll}
      />
      <AttivitaTotalsBar totals={totals} />
      <AttivitaViewToolbar
        group={fs.group}
        groupOptions={groupOptions}
        canExport={canExport}
        onChange={fs.setParam}
        onExport={() => setShowExport(true)}
      />
      <AttivitaDataGrid
        items={items}
        group={fs.group}
        isLoading={attivitaQuery.isLoading}
        isError={attivitaQuery.isError}
        filtersActive={Object.keys(fs.filters).length > 0}
        canExport={canExport}
        onClearFilters={fs.clearAll}
      />
      {showExport ? (
        <ExportDialog
          onClose={() => setShowExport(false)}
          initialFrom={fs.from}
          initialTo={fs.to}
          initialAziendaId={fs.aziendaId}
        />
      ) : null}
    </AppShell>
  );
}
