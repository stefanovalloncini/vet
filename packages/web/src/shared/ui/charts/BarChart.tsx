interface Bar {
  label: string;
  value: number;
}

interface BarChartProps {
  bars: ReadonlyArray<Bar>;
  formatValue?: (n: number) => string;
}

export function BarChart({ bars, formatValue }: BarChartProps) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  return (
    <ul className="space-y-2">
      {bars.map((b) => {
        const pct = Math.round((b.value / max) * 100);
        return (
          <li key={b.label} className="text-xs">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-(--color-text)">{b.label}</span>
              <span className="text-(--color-text-muted) tabular-nums">
                {formatValue ? formatValue(b.value) : b.value}
              </span>
            </div>
            <div className="w-full h-2 bg-(--color-surface-muted) rounded-full overflow-hidden">
              <div
                className="h-full bg-(--color-accent) rounded-full"
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
