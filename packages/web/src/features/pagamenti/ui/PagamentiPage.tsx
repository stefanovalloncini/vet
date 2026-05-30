import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell, Card, PageHeader } from "../../../shared/ui";
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

function PagamentoCard({ row }: { row: PagamentoOverview }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link
            to={routes.aziendaDetail.to({ id: row.azienda.id })}
            className="block truncate font-medium text-(--color-accent) hover:underline focus-visible:outline-none focus-visible:underline"
            title={row.azienda.nome}
          >
            {row.azienda.nome}
          </Link>
          <div className="mt-1.5">
            <StatoBadge status={statusOf(row)} size="sm" />
          </div>
          <p className="mt-1.5 text-xs text-(--color-text-subtle) tabular-nums">
            {t.colUltimo}:{" "}
            {row.ultimoContoAt ? formatDate(row.ultimoContoAt) : t.nessunConto}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] uppercase tracking-wide text-(--color-text-subtle)">
            {t.colAperto}
          </p>
          <p className="font-mono tabular-nums text-(--color-text)">
            {formatEuro(row.totaleAperto)}
          </p>
        </div>
      </div>
    </Card>
  );
}

const STATO_OPTIONS = [
  { value: "", label: t.filtroTutti },
  { value: "unpaid", label: t.filtroNonSaldati },
  { value: "todo", label: t.filtroDaEmettere },
  { value: "ok", label: t.filtroSaldato },
] as const;

export function PagamentiPage() {
  const now = useMemo(() => new Date(), []);
  const { rows, loading, error } = usePagamentiOverview(now);
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
            className="block max-w-[16rem] truncate text-(--color-accent) hover:underline focus-visible:outline-none focus-visible:underline"
            title={r.azienda.nome}
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
        footer: (rs) => (
          <span className="font-mono tabular-nums font-medium">
            {formatEuro(
              Math.round(rs.reduce((s, r) => s + r.totaleAperto, 0) * 100) / 100
            )}
          </span>
        ),
      },
      {
        id: "ultimo",
        header: t.colUltimo,
        accessor: (r) => r.ultimoContoAt?.getTime() ?? 0,
        sortable: true,
        cell: (r) =>
          r.ultimoContoAt ? (
            <span className="tabular-nums">{formatDate(r.ultimoContoAt)}</span>
          ) : (
            <span className="text-(--color-text-subtle)">{t.nessunConto}</span>
          ),
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
    <AppShell wide>
      <PageHeader title={t.title} subtitle={t.subtitle} />
      <DataGrid<PagamentoOverview>
        rows={rows}
        columns={columns}
        getRowId={(r) => r.azienda.id}
        mode="responsive"
        cardsLayout="list"
        card={(row) => <PagamentoCard row={row} />}
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
