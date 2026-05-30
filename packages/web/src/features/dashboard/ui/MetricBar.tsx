interface Metric {
  label: string;
  value: string;
}

interface MetricBarProps {
  metrics: ReadonlyArray<Metric>;
}

export function MetricBar({ metrics }: MetricBarProps) {
  return (
    <div className="grid grid-cols-2 divide-x divide-(--color-border) rounded-lg border border-(--color-border) bg-(--color-surface)">
      {metrics.map((m) => (
        <div key={m.label} className="flex flex-col gap-1 px-4 py-3">
          <span className="text-xs uppercase tracking-wider text-(--color-text-muted)">
            {m.label}
          </span>
          <span
            className="text-base sm:text-lg font-semibold tabular-nums text-(--color-text) leading-none"
            aria-live="polite"
          >
            {m.value}
          </span>
        </div>
      ))}
    </div>
  );
}
