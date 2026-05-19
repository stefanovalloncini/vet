interface Segment {
  key: string;
  label: string;
  value: number;
}

interface StackedBar {
  label: string;
  segments: Segment[];
  total: number;
}

interface StackedBarChartProps {
  bars: ReadonlyArray<StackedBar>;
  formatValue?: (n: number) => string;
}

const PALETTE = [
  "color-mix(in oklab, var(--color-accent) 95%, transparent)",
  "color-mix(in oklab, var(--color-accent) 70%, transparent)",
  "color-mix(in oklab, var(--color-accent) 45%, transparent)",
  "color-mix(in oklab, var(--color-success) 75%, transparent)",
  "color-mix(in oklab, var(--color-success) 50%, transparent)",
  "color-mix(in oklab, var(--color-danger) 60%, transparent)",
  "color-mix(in oklab, var(--color-text-muted) 50%, transparent)",
  "color-mix(in oklab, var(--color-text-subtle) 35%, transparent)",
];

export function StackedBarChart({
  bars,
  formatValue,
}: StackedBarChartProps) {
  const max = Math.max(...bars.map((b) => b.total), 1);
  const allKeys = new Map<string, { label: string; total: number }>();
  for (const b of bars) {
    for (const s of b.segments) {
      const cur = allKeys.get(s.key) ?? { label: s.label, total: 0 };
      cur.total += s.value;
      allKeys.set(s.key, cur);
    }
  }
  const colorByKey = new Map<string, string>();
  const orderedKeys = [...allKeys.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .map(([k, v], i) => {
      colorByKey.set(k, PALETTE[i % PALETTE.length]!);
      return { key: k, label: v.label, total: v.total };
    });

  return (
    <div>
      <div className="flex items-end gap-1 h-44">
        {bars.map((b) => {
          const heightPct = (b.total / max) * 100;
          return (
            <div
              key={b.label}
              className="flex-1 flex flex-col items-center min-w-0 group"
            >
              <div className="text-[10px] text-(--color-text-subtle) tabular-nums opacity-0 group-hover:opacity-100 transition-opacity h-3">
                {formatValue ? formatValue(b.total) : b.total}
              </div>
              <div
                className="w-full bg-(--color-surface-muted) rounded-sm flex flex-col-reverse overflow-hidden"
                style={{ height: `${heightPct}%`, minHeight: 1 }}
                title={`${b.label}: ${formatValue ? formatValue(b.total) : b.total}`}
              >
                {b.segments.map((seg) => {
                  const segPct = b.total > 0 ? (seg.value / b.total) * 100 : 0;
                  return (
                    <div
                      key={seg.key}
                      style={{
                        height: `${segPct}%`,
                        backgroundColor: colorByKey.get(seg.key),
                      }}
                    />
                  );
                })}
              </div>
              <span className="text-[10px] text-(--color-text-muted) mt-1 truncate w-full text-center">
                {b.label}
              </span>
            </div>
          );
        })}
      </div>
      {orderedKeys.length > 0 ? (
        <div className="flex flex-wrap gap-3 mt-4 text-xs">
          {orderedKeys.slice(0, 8).map((k) => (
            <div key={k.key} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: colorByKey.get(k.key) }}
              />
              <span className="text-(--color-text-muted)">{k.label}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
