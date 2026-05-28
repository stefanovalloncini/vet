import { ChartEmpty } from "./ChartEmpty";

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

export function StackedBarChart({ bars, formatValue }: StackedBarChartProps) {
  const fmt = formatValue ?? String;
  const peak = Math.max(...bars.map((b) => b.total), 0);
  if (bars.length === 0 || peak === 0) return <ChartEmpty />;
  const max = Math.max(peak, 1);
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

  const summary = bars.map((b) => `${b.label}: ${fmt(b.total)}`).join(", ");

  return (
    <div>
      <div
        className="flex h-44 items-end gap-1"
        role="img"
        aria-label={`Ricavi mese per mese: ${summary}.`}
      >
        {bars.map((b) => {
          const heightPct = (b.total / max) * 100;
          return (
            <div
              key={b.label}
              className="group flex min-w-0 flex-1 flex-col items-center"
            >
              <div className="h-3 text-[10px] tabular-nums text-(--color-text-subtle) opacity-0 transition-opacity group-hover:opacity-100">
                {fmt(b.total)}
              </div>
              <div
                className="flex w-full flex-col-reverse overflow-hidden rounded-sm bg-(--color-surface-muted)"
                style={{ height: `${heightPct}%`, minHeight: 1 }}
                title={`${b.label}: ${fmt(b.total)}`}
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
              <span className="mt-1 w-full truncate text-center text-[10px] text-(--color-text-muted)">
                {b.label}
              </span>
            </div>
          );
        })}
      </div>
      {orderedKeys.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5 text-xs">
          {orderedKeys.slice(0, 8).map((k) => (
            <div key={k.key} className="flex min-w-0 items-center gap-1.5">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: colorByKey.get(k.key) }}
              />
              <span className="truncate text-(--color-text-muted)">{k.label}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
