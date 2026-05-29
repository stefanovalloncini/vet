import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { Badge, EmptyState } from "../../../shared/ui";
import { DataGrid, dataGridIt } from "../../../shared/ui/data-grid";
import type {
  Column,
  FilterDef,
  RowAction,
} from "../../../shared/ui/data-grid";
import { formatEuro } from "../../../shared/lib/format";
import { routes } from "../../../routes";
import { aziendeI18n as t } from "../i18n";
import { AziendaCard, statusFor } from "./AziendaCard";
import type { Azienda } from "@vet/shared";

const capiFormatter = new Intl.NumberFormat("it-IT", {
  maximumFractionDigits: 0,
});

interface AziendeListProps {
  items: ReadonlyArray<Azienda>;
  loading: boolean;
  error: string | null;
  canEdit: boolean;
  canCreate: boolean;
  searching: boolean;
  isPinned: (id: string) => boolean;
  onTogglePin: (id: string) => void;
  hasUnsaldatiContiBy?: ReadonlySet<string>;
  needsNewContoBy?: ReadonlySet<string>;
  totaleApertoBy?: ReadonlyMap<string, number>;
  filters: ReadonlyArray<FilterDef>;
  onFiltersChange: (next: ReadonlyArray<FilterDef>) => void;
}

export function AziendeList({
  items,
  loading,
  error,
  canEdit,
  canCreate,
  searching,
  isPinned,
  onTogglePin,
  hasUnsaldatiContiBy,
  needsNewContoBy,
  totaleApertoBy,
  filters,
  onFiltersChange,
}: AziendeListProps) {
  const hasUnsaldati = useMemo(
    () => hasUnsaldatiContiBy ?? new Set<string>(),
    [hasUnsaldatiContiBy]
  );
  const needsNew = useMemo(
    () => needsNewContoBy ?? new Set<string>(),
    [needsNewContoBy]
  );
  const totaleAperto = useMemo(
    () => totaleApertoBy ?? new Map<string, number>(),
    [totaleApertoBy]
  );

  const columns = useMemo<ReadonlyArray<Column<Azienda>>>(
    () => [
      {
        id: "search",
        header: "Cerca",
        accessor: (a) => a.nomeNorm,
        filterId: "search",
        hiddenByDefault: true,
        sortable: false,
      },
      {
        id: "nome",
        header: "Nome",
        accessor: (a) => a.nome,
        sortable: true,
        cell: (a) => (
          <Link
            to={routes.aziendaDetail.to({ id: a.id })}
            className="block max-w-[20rem] truncate font-medium text-(--color-text) hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-1 rounded"
            title={a.nome}
          >
            {a.nome}
          </Link>
        ),
      },
      {
        id: "capi",
        header: "Capi",
        accessor: (a) => a.numeroCapi ?? -1,
        align: "end",
        tone: "muted",
        cell: (a) => (
          <span className="tabular-nums">
            {a.numeroCapi !== undefined
              ? capiFormatter.format(a.numeroCapi)
              : "—"}
          </span>
        ),
      },
      {
        id: "telefono",
        header: "Telefono",
        accessor: (a) => a.telefono ?? "",
        tone: "muted",
        cell: (a) =>
          a.telefono ? (
            <span className="tabular-nums">{a.telefono}</span>
          ) : (
            <span className="text-(--color-text-subtle)">—</span>
          ),
      },
      {
        id: "dovuto",
        header: "Totale dovuto",
        accessor: (a) => totaleAperto.get(a.id) ?? 0,
        align: "end",
        sortable: true,
        cell: (a) => {
          const v = totaleAperto.get(a.id) ?? 0;
          return v > 0 ? (
            <span className="font-mono tabular-nums">{formatEuro(v)}</span>
          ) : (
            <span className="text-(--color-text-subtle)">—</span>
          );
        },
      },
      {
        id: "stato",
        header: "Stato",
        accessor: (a) =>
          statusFor(hasUnsaldati.has(a.id), needsNew.has(a.id)).key,
        filterId: "stato",
        cell: (a) => {
          const status = statusFor(hasUnsaldati.has(a.id), needsNew.has(a.id));
          return (
            <Badge tone={status.tone} dot>
              {status.label}
            </Badge>
          );
        },
      },
    ],
    [hasUnsaldati, needsNew, totaleAperto]
  );

  const rowActions = useMemo<ReadonlyArray<RowAction<Azienda>>>(
    () => [
      {
        id: "pin",
        label: "Preferito",
        icon: <Star size={16} strokeWidth={1.75} aria-hidden="true" />,
        onClick: (a) => onTogglePin(a.id),
      },
    ],
    [onTogglePin]
  );

  return (
    <DataGrid<Azienda>
      rows={items}
      columns={columns}
      getRowId={(a) => a.id}
      mode="responsive"
      i18n={dataGridIt}
      loading={loading}
      error={error}
      filters={filters}
      onFiltersChange={onFiltersChange}
      rowActions={rowActions}
      card={(a, { actions }) => (
        <AziendaCard
          azienda={a}
          canEdit={canEdit}
          pinned={isPinned(a.id)}
          onTogglePin={() => onTogglePin(a.id)}
          hasUnsaldatiConti={hasUnsaldati.has(a.id)}
          needsNewConto={needsNew.has(a.id)}
          actions={actions}
        />
      )}
      emptyState={renderEmpty(searching, canCreate)}
    />
  );
}

function renderEmpty(searching: boolean, canCreate: boolean) {
  if (searching) return <EmptyState title={t.emptySearch} />;
  return (
    <EmptyState
      title={t.empty}
      {...(canCreate ? { description: t.emptyHint } : {})}
    />
  );
}
