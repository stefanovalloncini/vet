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
import { useVetStats, type VetStat } from "../hooks/useVetStats";
import { formatEuro } from "../../../shared/lib/format";
import { SortableTH, type SortDir, type SortKey } from "./SortableTH";

type Range = "month" | "year" | "all";

const RANGE_OPTIONS = [
  { value: "month", label: "Questo mese" },
  { value: "year", label: "Questo anno" },
  { value: "all", label: "Sempre" },
];

function compare(a: VetStat, b: VetStat, key: SortKey): number {
  if (key === "nome") return a.nome.localeCompare(b.nome, "it");
  if (key === "count") return a.count - b.count;
  if (key === "total") return a.total - b.total;
  const aTime = a.lastActivity?.getTime() ?? 0;
  const bTime = b.lastActivity?.getTime() ?? 0;
  return aTime - bTime;
}

export function VetStatsPage() {
  const [range, setRange] = useState<Range>("month");
  const [sortKey, setSortKey] = useState<SortKey>("total");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
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

  const sorted = useMemo(() => {
    const arr = [...stats];
    arr.sort((a, b) => {
      const cmp = compare(a, b, sortKey);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [stats, sortKey, sortDir]);

  function toggleSort(key: SortKey): void {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir(key === "nome" ? "asc" : "desc");
  }

  const totalAll = stats.reduce((s, v) => s + v.total, 0);

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
              <table className="w-full text-sm border-collapse">
                <caption className="sr-only">
                  Statistiche per veterinario nel periodo selezionato.
                </caption>
                <thead>
                  <tr className="border-b border-(--color-border) bg-(--color-surface-muted)/50">
                    <SortableTH
                      label="Veterinario"
                      sortKey="nome"
                      activeKey={sortKey}
                      dir={sortDir}
                      onToggle={toggleSort}
                    />
                    <SortableTH
                      label="Visite"
                      sortKey="count"
                      activeKey={sortKey}
                      dir={sortDir}
                      onToggle={toggleSort}
                      align="right"
                    />
                    <SortableTH
                      label="Totale"
                      sortKey="total"
                      activeKey={sortKey}
                      dir={sortDir}
                      onToggle={toggleSort}
                      align="right"
                    />
                    <SortableTH
                      label="Ultima attività"
                      sortKey="lastActivity"
                      activeKey={sortKey}
                      dir={sortDir}
                      onToggle={toggleSort}
                      align="right"
                      className="hidden sm:table-cell"
                    />
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--color-border)">
                  {sorted.map((s) => (
                    <StatRow key={s.uid} stat={s} totalAll={totalAll} />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}

function StatRow({ stat, totalAll }: { stat: VetStat; totalAll: number }) {
  const pct = totalAll > 0 ? Math.round((stat.total / totalAll) * 100) : 0;
  const nome = stat.nome.trim() || stat.email.trim() || "—";
  return (
    <tr>
      <td className="px-4 py-2.5 max-w-0">
        <p className="text-sm font-medium text-(--color-text) truncate">
          {nome}
        </p>
        {stat.email.trim() ? (
          <p className="text-[11px] text-(--color-text-subtle) font-mono truncate">
            {stat.email}
          </p>
        ) : null}
      </td>
      <td className="px-4 py-2.5 text-right tabular-nums text-(--color-text-muted) align-top">
        {stat.count}
      </td>
      <td className="px-4 py-2.5 text-right align-top">
        <p className="text-sm font-medium text-(--color-text) tabular-nums">
          {formatEuro(stat.total)}
        </p>
        <p className="text-[11px] text-(--color-text-subtle) tabular-nums">
          {pct}%
        </p>
      </td>
      <td className="px-4 py-2.5 text-right tabular-nums text-(--color-text-muted) hidden sm:table-cell align-top">
        {stat.lastActivity
          ? stat.lastActivity.toLocaleDateString("it-IT")
          : "—"}
      </td>
    </tr>
  );
}
