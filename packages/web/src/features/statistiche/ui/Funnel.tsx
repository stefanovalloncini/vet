import { ChartEmpty } from "./ChartEmpty";

interface FunnelStage {
  label: string;
  value: number;
  hint?: string;
}

interface FunnelProps {
  stages: ReadonlyArray<FunnelStage>;
  formatValue?: (n: number) => string;
}

export function Funnel({ stages, formatValue }: FunnelProps) {
  const max = Math.max(...stages.map((s) => s.value), 0);
  if (stages.length === 0 || max === 0) return <ChartEmpty />;
  return (
    <ul className="space-y-3">
      {stages.map((s, i) => {
        const pct = Math.round((s.value / max) * 100);
        const prev = i > 0 ? stages[i - 1]!.value : null;
        const dropoff =
          prev !== null && prev > 0
            ? Math.round((s.value / prev) * 100)
            : null;
        return (
          <li key={s.label}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 text-(--color-text)">{s.label}</span>
              <span className="shrink-0 tabular-nums text-(--color-text-muted)">
                {formatValue ? formatValue(s.value) : s.value}
                {dropoff !== null ? (
                  <span className="ml-2 text-xs text-(--color-text-subtle)">
                    {dropoff}% del precedente
                  </span>
                ) : null}
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-(--color-surface-muted)">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  background: `color-mix(in oklab, var(--color-accent) ${95 - i * 18}%, transparent)`,
                }}
              />
            </div>
            {s.hint ? (
              <p className="mt-1 text-xs text-(--color-text-subtle)">{s.hint}</p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
