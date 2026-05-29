import { useMemo, useState } from "react";
import { AppShell, EmptyState, PageHeader } from "../../../shared/ui";
import {
  DataGrid,
  dataGridIt,
  type Column,
} from "../../../shared/ui/data-grid";
import { useAziende } from "../../aziende/hooks/useAziende";
import { useConti } from "../hooks/useConti";
import {
  computeContiCounters,
  groupContiByAzienda,
} from "../lib/groupContiByAzienda";
import { buildContiRows, type ContoRow } from "../lib/buildContiRows";
import { buildContiColumns, contoCard } from "./conti-grid/columns";
import { ContiToolbar } from "./conti-grid/ContiToolbar";
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

  const grouped = useMemo(() => groupContiByAzienda(conti ?? []), [conti]);
  const counters = useMemo(
    () => computeContiCounters(aziende ?? [], grouped),
    [aziende, grouped]
  );
  const rows = useMemo(
    () => buildContiRows(aziende ?? [], grouped, onlyUnsaldati),
    [aziende, grouped, onlyUnsaldati]
  );

  const columns = useMemo<ReadonlyArray<Column<ContoRow>>>(
    () => buildContiColumns(),
    []
  );

  const isPending = aziendePending || contiPending;
  const isError = aziendeError || contiError;
  const noContiAtAll = grouped.size === 0;

  const emptyState = (
    <EmptyState title={noContiAtAll ? t.emptyAll : t.emptyFiltered} />
  );

  return (
    <AppShell wide>
      <PageHeader title={t.title} subtitle={t.subtitle} />
      <DataGrid<ContoRow>
        rows={rows}
        columns={columns}
        getRowId={(r) => r.azienda.id}
        mode="responsive"
        card={contoCard}
        i18n={dataGridIt}
        loading={isPending}
        error={isError ? t.loadError : null}
        emptyState={emptyState}
        toolbar={{
          extra: (
            <ContiToolbar
              onlyUnsaldati={onlyUnsaldati}
              onToggle={setOnlyUnsaldati}
              counters={counters}
            />
          ),
        }}
      />
    </AppShell>
  );
}
