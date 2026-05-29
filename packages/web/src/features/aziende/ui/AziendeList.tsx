import { useMemo } from "react";
import { Star } from "lucide-react";
import { EmptyState } from "../../../shared/ui";
import { DataGrid, dataGridIt } from "../../../shared/ui/data-grid";
import type {
  Column,
  FilterDef,
  RowAction,
} from "../../../shared/ui/data-grid";
import { aziendeI18n as t } from "../i18n";
import { AziendaCard, statusFor } from "./AziendaCard";
import type { Azienda } from "@vet/shared";

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

  const columns = useMemo<ReadonlyArray<Column<Azienda>>>(
    () => [
      {
        id: "nome",
        header: "Nome",
        accessor: (a) => a.nome,
        sortable: true,
      },
      {
        id: "tipo",
        header: "Tipo",
        accessor: (a) => a.tipoAllevamento ?? "",
        filterId: "tipo",
      },
      {
        id: "cadenza",
        header: "Cadenza",
        accessor: (a) => a.cadenzaFatturazione ?? "",
        filterId: "cadenza",
      },
      {
        id: "stato",
        header: "Stato",
        accessor: (a) =>
          statusFor(hasUnsaldati.has(a.id), needsNew.has(a.id)).key,
        filterId: "stato",
      },
    ],
    [hasUnsaldati, needsNew]
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
      mode="cards"
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
