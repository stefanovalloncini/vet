import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
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

type Range = "month" | "year" | "all";
type SortKey = "nome" | "count" | "total" | "lastActivity";
type SortDir = "asc" | "desc";

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

interface SortableTHProps {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: SortDir;
  onToggle: (key: SortKey) => void;
  align?: "left" | "right";
  className?: string;
}

function SortableTH({
  label,
  sortKey,
  activeKey,
  dir,
  onToggle,
  align = "left",
  className = "",
}: SortableTHProps) {
  const active = activeKey === sortKey;
  const ariaSort: "ascending" | "descending" | "none" = active
    ? dir === "asc"
      ? "ascending"
      : "descending"
    : "none";
  const thAlign = align === "right" ? "text-right" : "text-left";
  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className={`px-4 py-2.5 ${thAlign} font-normal ${className}`}
    >
      <button
        type="button"
        onClick={() => onToggle(sortKey)}
        className={[
          "inline-flex items-center gap-1 text-[11px] uppercase tracking-wider font-medium transition-colors duration-(--motion-fast) ease-(--ease-out-quart)",
          active
            ? "text-(--color-text)"
            : "text-(--color-text-muted) hover:text-(--color-text)",
          align === "right" ? "justify-end w-full" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <span>{label}</span>
        <span aria-hidden="true" className="inline-flex w-3 h-3 items-center">
          {active ? (
            dir === "asc" ? (
              <ArrowUp size={12} strokeWidth={1.75} />
            ) : (
              <ArrowDown size={12} strokeWidth={1.75} />
            )
          ) : null}
        </span>
      </button>
    </th>
  );
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
                {sorted.map((s) => {
                  const pct = totalAll > 0 ? Math.round((s.total / totalAll) * 100) : 0;
                  return (
                    <tr key={s.uid}>
                      <td className="px-4 py-2.5">
                        <p className="text-sm font-medium text-(--color-text) truncate">
                          {s.nome}
                        </p>
                        <p className="text-[11px] text-(--color-text-subtle) font-mono truncate">
                          {s.email}
                        </p>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-(--color-text-muted)">
                        {s.count}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <p className="text-sm font-medium text-(--color-text) tabular-nums">
                          {formatEuro(s.total)}
                        </p>
                        <p className="text-[11px] text-(--color-text-subtle) tabular-nums">
                          {pct}%
                        </p>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-(--color-text-muted) hidden sm:table-cell">
                        {s.lastActivity
                          ? s.lastActivity.toLocaleDateString("it-IT")
                          : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </AdminLayout>
  );
}
