import { useMemo, type ReactNode } from "react";
import { roundCents } from "../../../shared/lib/money";
import { Link } from "react-router-dom";
import type { Attivita } from "@vet/shared";
import { Button, EmptyState } from "../../../shared/ui";
import {
  DataGrid,
  dataGridIt,
  type Column,
  type GroupingDef,
} from "../../../shared/ui/data-grid";
import { useAuthState } from "../../auth";
import { dateInputValue, formatDate, formatEuro } from "../../../shared/lib/format";
import { routes } from "../../../routes";
import { attivitaI18n as t } from "../i18n";
import type { GroupKey } from "../lib/totals";
import { AttivitaRow } from "./AttivitaRow";

const dayLabelFormatter = new Intl.DateTimeFormat("it-IT", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const oreFormatter = new Intl.NumberFormat("it-IT", {
  maximumFractionDigits: 2,
});

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function sumTotals(rows: ReadonlyArray<Attivita>): number {
  let s = 0;
  for (const a of rows) s += a.totale;
  return roundCents(s);
}

export function groupingFor(group: GroupKey): GroupingDef<Attivita> | undefined {
  if (group === "none") return undefined;
  if (group === "giorno") {
    return {
      keyOf: (a) => dateInputValue(a.data),
      labelOf: (_key, rows) => {
        const first = rows[0];
        return first ? dayLabelFormatter.format(first.data) : "";
      },
      summary: (rows) => formatEuro(sumTotals(rows)),
    };
  }
  if (group === "azienda") {
    return {
      keyOf: (a) => a.aziendaId,
      labelOf: (_key, rows) => rows[0]?.aziendaNome ?? "",
      summary: (rows) => formatEuro(sumTotals(rows)),
    };
  }
  // vet
  return {
    keyOf: (a) => a.ownerUid,
    labelOf: (_key, rows) => rows[0]?.ownerName ?? "",
    summary: (rows) => formatEuro(sumTotals(rows)),
  };
}

function buildColumns(): ReadonlyArray<Column<Attivita>> {
  return [
    {
      id: "data",
      header: t.colData,
      width: 110,
      sortable: true,
      accessor: (a) => a.data.getTime(),
      cell: (a) => (
        <Link
          to={routes.attivitaEdit.to({ id: a.id })}
          className="block tabular-nums text-(--color-text-muted) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-1 rounded"
        >
          {formatDate(a.data)}
        </Link>
      ),
      export: (a) => ({ text: isoDate(a.data) }),
    },
    {
      id: "azienda",
      header: t.colAzienda,
      sortable: true,
      filterId: "azienda",
      accessor: (a) => a.aziendaNome,
      cell: (a) => (
        <Link
          to={routes.attivitaEdit.to({ id: a.id })}
          className="block max-w-[24ch] focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-1 rounded"
        >
          <span className="block text-(--color-text) font-medium hover:text-(--color-accent) transition-colors break-words">
            {a.aziendaNome}
          </span>
          <span className="block text-xs text-(--color-text-subtle) mt-0.5 truncate">
            {a.ownerName}
          </span>
        </Link>
      ),
      export: (a) => ({ text: a.aziendaNome }),
    },
    {
      id: "tipo",
      header: t.colTipo,
      sortable: true,
      filterId: "tipo",
      accessor: (a) => a.tipoNome,
      cell: (a) => (
        <div className="max-w-[28ch]">
          <span className="block text-(--color-text) break-words">{a.tipoNome}</span>
          {a.note ? (
            <span className="block text-xs text-(--color-text-subtle) mt-0.5 truncate">
              {a.note}
            </span>
          ) : null}
        </div>
      ),
      export: (a) => ({ text: a.tipoNome }),
    },
    {
      id: "ore",
      header: t.colOre,
      align: "end",
      width: 64,
      sortable: true,
      accessor: (a) => a.ore ?? 0,
      cell: (a) => (
        <span className="tabular-nums text-(--color-text-muted)">
          {a.oraria && a.ore !== undefined ? oreFormatter.format(a.ore) : "—"}
        </span>
      ),
      export: (a) => ({
        text: a.ore?.toString() ?? "",
        ...(a.ore !== undefined ? { numeric: a.ore } : {}),
      }),
    },
    {
      id: "tariffa",
      header: t.colTariffa,
      align: "end",
      width: 100,
      sortable: true,
      accessor: (a) => a.tariffa,
      cell: (a) => (
        <span className="tabular-nums text-(--color-text-muted)">
          {formatEuro(a.tariffa)}
        </span>
      ),
      export: (a) => ({ text: a.tariffa.toFixed(2), numeric: a.tariffa }),
    },
    {
      id: "totale",
      header: t.colTotale,
      align: "end",
      width: 110,
      sortable: true,
      accessor: (a) => a.totale,
      cell: (a) => (
        <strong className="tabular-nums font-medium text-(--color-text)">
          {formatEuro(a.totale)}
        </strong>
      ),
      footer: (rows) => (
        <span className="tabular-nums">{formatEuro(sumTotals(rows))}</span>
      ),
      export: (a) => ({ text: a.totale.toFixed(2), numeric: a.totale }),
    },
  ];
}

function attivitaCard(row: Attivita): ReactNode {
  return (
    <div className="bg-(--color-surface) border border-(--color-border) rounded-2xl overflow-hidden">
      <AttivitaRow attivita={row} />
    </div>
  );
}

interface EmptyAttivitaProps {
  filtered: boolean;
  onClearFilters?: () => void;
}

function EmptyAttivita({ filtered, onClearFilters }: EmptyAttivitaProps) {
  const { user } = useAuthState();
  const canCreate = user?.caps.has("activities.create") ?? false;
  if (filtered) {
    return (
      <EmptyState
        title={t.emptyFiltered}
        description={t.emptyFilteredHint}
        {...(onClearFilters
          ? {
              action: (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClearFilters}
                >
                  {t.pulisciFiltri}
                </Button>
              ),
            }
          : {})}
      />
    );
  }
  return (
    <EmptyState
      title={t.emptyAll}
      {...(canCreate ? { description: t.emptyAllHint } : {})}
    />
  );
}

interface AttivitaDataGridProps {
  items: ReadonlyArray<Attivita>;
  group: GroupKey;
  isLoading: boolean;
  isError: boolean;
  filtersActive: boolean;
  onClearFilters?: () => void;
}

export function AttivitaDataGrid({
  items,
  group,
  isLoading,
  isError,
  filtersActive,
  onClearFilters,
}: AttivitaDataGridProps) {
  const columns = useMemo(() => buildColumns(), []);
  const grouping = useMemo(() => groupingFor(group), [group]);

  const emptyState = (
    <EmptyAttivita
      filtered={filtersActive}
      {...(onClearFilters ? { onClearFilters } : {})}
    />
  );

  const error = isError ? t.loadError : null;

  const commonProps = {
    rows: items,
    columns,
    getRowId: (a: Attivita) => a.id,
    i18n: dataGridIt,
    loading: isLoading,
    error,
    emptyState,
    ...(grouping ? { groupBy: grouping } : {}),
  } as const;

  return <DataGrid<Attivita> {...commonProps} mode="responsive" card={attivitaCard} />;
}
