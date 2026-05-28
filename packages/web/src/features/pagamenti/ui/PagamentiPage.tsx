import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell, PageHeader } from "../../../shared/ui";
import {
  DataGrid,
  dataGridIt,
  type Column,
  type ExpandDef,
  type FilterDef,
} from "../../../shared/ui/data-grid";
import { formatDate, formatEuro } from "../../../shared/lib/format";
import { routes } from "../../../routes";
import { ContiPerAziendaTab } from "../../conti";
import { usePagamentiOverview, type PagamentoOverview } from "../hooks/usePagamentiOverview";
import { StatoBadge, type StatoBadgeStatus } from "./StatoBadge";
import { pagamentiI18n as t } from "../i18n";

function statusOf(row: PagamentoOverview): StatoBadgeStatus {
  if (row.hasUnpaid) return "unpaid";
  if (row.needsNewConto) return "todo";
  return "ok";
}

const STATO_OPTIONS = [
  { value: "", label: t.filtroTutti },
  { value: "unpaid", label: t.filtroNonSaldati },
  { value: "todo", label: t.filtroDaEmettere },
  { value: "ok", label: t.filtroSaldato },
] as const;

export function PagamentiPage() {
  const { rows, loading, error } = usePagamentiOverview();
  const [statoFilter, setStatoFilter] = useState<string>("");
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(
    () => new Set()
  );

  const columns = useMemo<ReadonlyArray<Column<PagamentoOverview>>>(
    () => [
      {
        id: "nome",
        header: t.colAzienda,
        accessor: (r) => r.azienda.nome,
        sortable: true,
        cell: (r) => (
          <Link
            to={routes.aziendaDetail.to({ id: r.azienda.id })}
            className="text-(--color-accent) hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {r.azienda.nome}
          </Link>
        ),
      },
      {
        id: "stato",
        header: t.colStato,
        accessor: (r) => statusOf(r),
        filterId: "stato",
        cell: (r) => <StatoBadge status={statusOf(r)} size="sm" />,
      },
      {
        id: "aperto",
        header: t.colAperto,
        accessor: (r) => r.totaleAperto,
        align: "end",
        sortable: true,
        cell: (r) => (
          <span className="font-mono tabular-nums">
            {formatEuro(r.totaleAperto)}
          </span>
        ),
      },
      {
        id: "ultimo",
        header: t.colUltimo,
        accessor: (r) => r.ultimoContoAt?.getTime() ?? 0,
        sortable: true,
        cell: (r) =>
          r.ultimoContoAt ? formatDate(r.ultimoContoAt) : t.nessunConto,
      },
    ],
    []
  );

  const filters = useMemo<ReadonlyArray<FilterDef>>(
    () => [
      {
        id: "stato",
        label: t.filterStato,
        kind: "select",
        value: statoFilter,
        options: STATO_OPTIONS,
      },
    ],
    [statoFilter]
  );

  const handleFiltersChange = (next: ReadonlyArray<FilterDef>) => {
    const stato = next.find((f) => f.id === "stato");
    setStatoFilter(typeof stato?.value === "string" ? stato.value : "");
  };

  const expand: ExpandDef<PagamentoOverview> = useMemo(
    () => ({
      rowId: (r) => r.azienda.id,
      render: (r) => <ContiPerAziendaTab aziendaId={r.azienda.id} />,
    }),
    []
  );

  return (
    <AppShell>
      <PageHeader title={t.title} subtitle={t.subtitle} />
      <DataGrid<PagamentoOverview>
        rows={rows}
        columns={columns}
        getRowId={(r) => r.azienda.id}
        mode="table"
        i18n={dataGridIt}
        loading={loading}
        error={error}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        expand={expand}
        expandedIds={expandedIds}
        onExpandedChange={setExpandedIds}
      />
    </AppShell>
  );
}
