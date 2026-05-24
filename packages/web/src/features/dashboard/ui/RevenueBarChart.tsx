interface TrailingBarChartProps {
  values: number[];
  labels: string[];
  formatValue: (value: number) => string;
  totalLabel: string;
  className?: string;
}

export function TrailingBarChart({
  values,
  labels,
  formatValue,
  totalLabel,
  className = "",
}: TrailingBarChartProps) {
  if (values.length === 0) return null;
  const max = Math.max(...values, 1);
  const total = values.reduce((s, v) => s + v, 0);
  const peakIndex = values.indexOf(Math.max(...values));
  const currentIndex = values.length - 1;

  return (
    <div className={className}>
      <div className="flex items-end gap-1 h-24 sm:h-28">
        {values.map((v, i) => {
          const pct = max > 0 ? (v / max) * 100 : 0;
          const isCurrent = i === currentIndex;
          const isPeak = i === peakIndex && v > 0;
          const height = v > 0 ? Math.max(pct, 4) : 2;
          return (
            <div
              key={`${labels[i]}-${i}`}
              className="flex-1 flex flex-col items-center justify-end h-full min-w-0"
            >
              <div
                title={`${labels[i] ?? ""}: ${formatValue(v)}`}
                className={[
                  "w-full rounded-t-md transition-colors",
                  v === 0
                    ? "bg-(--color-surface-muted)"
                    : isCurrent
                      ? "bg-(--color-accent)"
                      : isPeak
                        ? "bg-(--color-accent)/70"
                        : "bg-(--color-accent)/40",
                ].join(" ")}
                style={{ height: `${height}%` }}
                aria-label={`${labels[i] ?? ""}: ${formatValue(v)}`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-1 mt-2">
        {labels.map((l, i) => (
          <div
            key={`${l}-${i}`}
            className={[
              "flex-1 text-center text-[10px] truncate",
              i === currentIndex
                ? "text-(--color-text) font-medium"
                : "text-(--color-text-subtle)",
            ].join(" ")}
          >
            {l}
          </div>
        ))}
      </div>
      <div className="flex items-baseline justify-between mt-4 pt-3 border-t border-(--color-border)">
        <span className="text-[10px] uppercase tracking-wider text-(--color-text-muted)">
          {totalLabel}
        </span>
        <span className="text-base font-medium text-(--color-text) tabular-nums">
          {formatValue(total)}
        </span>
      </div>
    </div>
  );
}
