import { useMemo, useState } from "react";
import {
  AdminLayout,
  Card,
  EmptyState,
  InlineError,
  LoadingHint,
  PageHeader,
  Select,
} from "../../../shared/ui";
import {
  DataGrid,
  dataGridIt,
  type Column,
} from "../../../shared/ui/data-grid";
import { useVetStats, type VetStat } from "../hooks/useVetStats";
import { formatEuro } from "../../../shared/lib/format";

type Range = "month" | "year" | "all";

const RANGE_OPTIONS = [
  { value: "month", label: "Questo mese" },
  { value: "year", label: "Questo anno" },
  { value: "all", label: "Sempre" },
];

function displayName(stat: VetStat): string {
  return stat.nome.trim() || stat.email.trim() || "—";
}

function buildColumns(totalAll: number): ReadonlyArray<Column<VetStat>> {
  return [
    {
      id: "nome",
      header: "Veterinario",
      sortable: true,
      accessor: (s) => displayName(s),
      cell: (s) => (
        <div className="max-w-0">
          <p className="text-sm font-medium text-(--color-text) truncate">
            {displayName(s)}
          </p>
          {s.email.trim() ? (
            <p className="text-[11px] text-(--color-text-subtle) font-mono truncate">
              {s.email}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      id: "count",
      header: "Visite",
      align: "end",
      sortable: true,
      accessor: (s) => s.count,
      cell: (s) => (
        <span className="tabular-nums text-(--color-text-muted)">{s.count}</span>
      ),
    },
    {
      id: "total",
      header: "Totale",
      align: "end",
      sortable: true,
      accessor: (s) => s.total,
      cell: (s) => {
        const pct = totalAll > 0 ? Math.round((s.total / totalAll) * 100) : 0;
        return (
          <div className="text-right">
            <p className="text-sm font-medium text-(--color-text) tabular-nums">
              {formatEuro(s.total)}
            </p>
            <p className="text-[11px] text-(--color-text-subtle) tabular-nums">
              {pct}%
            </p>
          </div>
        );
      },
    },
    {
      id: "lastActivity",
      header: "Ultima attività",
      align: "end",
      sortable: true,
      headerClassName: "hidden sm:table-cell",
      cellClassName: "hidden sm:table-cell",
      accessor: (s) => s.lastActivity?.getTime() ?? 0,
      cell: (s) => (
        <span className="tabular-nums text-(--color-text-muted)">
          {s.lastActivity
            ? s.lastActivity.toLocaleDateString("it-IT")
            : "—"}
        </span>
      ),
    },
  ];
}

export function VetStatsPage() {
  const [range, setRange] = useState<Range>("month");
  const now = useMemo(() => new Date(), []);

  const filters = useMemo(() => {
    if (range === "month") {
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
      };
    }
    if (range === "year") {
      return {
        from: new Date(now.getFullYear(), 0, 1),
        to: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999),
      };
    }
    return {};
  }, [range, now]);

  const { data, isLoading, isError } = useVetStats(filters);
  const stats = useMemo(() => data ?? [], [data]);

  const totalAll = stats.reduce((s, v) => s + v.total, 0);
  const columns = useMemo(() => buildColumns(totalAll), [totalAll]);

  return (
    <AdminLayout>
      <PageHeader
        title="Statistiche veterinari"
        subtitle="Visite, incassi e ultima attività per veterinario."
      />

      <div className="mb-5 max-w-xs">
        <Select
          id="range"
          label="Periodo"
          value={range}
          options={RANGE_OPTIONS}
          onChange={(e) => setRange(e.target.value as Range)}
        />
      </div>

      <div aria-live="polite">
        {isLoading ? (
          <LoadingHint />
        ) : isError ? (
          <InlineError>Caricamento fallito.</InlineError>
        ) : stats.length === 0 ? (
          <EmptyState title="Nessun dato per il periodo." />
        ) : (
          <Card padded={false}>
            <div className="overflow-x-auto">
              <DataGrid<VetStat>
                rows={stats}
                columns={columns}
                getRowId={(s) => s.uid}
                mode="table"
                i18n={dataGridIt}
                caption="Statistiche per veterinario nel periodo selezionato."
                defaultSort={{ columnId: "total", direction: "desc" }}
              />
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
