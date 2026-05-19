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
  if (stages.length === 0) return null;
  const max = Math.max(...stages.map((s) => s.value), 1);
  return (
    <ul className="space-y-2">
      {stages.map((s, i) => {
        const pct = Math.round((s.value / max) * 100);
        const prev = i > 0 ? stages[i - 1]!.value : null;
        const dropoff =
          prev !== null && prev > 0
            ? Math.round((s.value / prev) * 100)
            : null;
        return (
          <li key={s.label}>
            <div className="flex items-baseline justify-between mb-1 text-sm">
              <span className="text-(--color-text)">{s.label}</span>
              <span className="tabular-nums text-(--color-text-muted)">
                {formatValue ? formatValue(s.value) : s.value}
                {dropoff !== null ? (
                  <span className="ml-2 text-xs text-(--color-text-subtle)">
                    {dropoff}%
                  </span>
                ) : null}
              </span>
            </div>
            <div className="w-full h-3 bg-(--color-surface-muted) rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  background: `color-mix(in oklab, var(--color-accent) ${95 - i * 18}%, transparent)`,
                }}
              />
            </div>
            {s.hint ? (
              <p className="text-xs text-(--color-text-subtle) mt-1">
                {s.hint}
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
