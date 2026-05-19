interface DonutSlice {
  label: string;
  value: number;
}

interface DonutChartProps {
  slices: ReadonlyArray<DonutSlice>;
  size?: number;
  thickness?: number;
  formatValue?: (n: number) => string;
}

const PALETTE = [
  "color-mix(in oklab, var(--color-accent) 90%, transparent)",
  "color-mix(in oklab, var(--color-accent) 70%, transparent)",
  "color-mix(in oklab, var(--color-accent) 50%, transparent)",
  "color-mix(in oklab, var(--color-success) 70%, transparent)",
  "color-mix(in oklab, var(--color-success) 45%, transparent)",
  "color-mix(in oklab, var(--color-danger) 60%, transparent)",
  "color-mix(in oklab, var(--color-text-muted) 50%, transparent)",
  "color-mix(in oklab, var(--color-text-subtle) 35%, transparent)",
];

export function DonutChart({
  slices,
  size = 160,
  thickness = 20,
  formatValue,
}: DonutChartProps) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total === 0) return null;
  const r = size / 2 - thickness / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;

  let accum = 0;
  const arcs = slices.map((s, i) => {
    const frac = s.value / total;
    const dasharray = `${frac * circ} ${circ - frac * circ}`;
    const offset = -accum * circ;
    accum += frac;
    return (
      <circle
        key={s.label}
        cx={c}
        cy={c}
        r={r}
        fill="transparent"
        stroke={PALETTE[i % PALETTE.length]}
        strokeWidth={thickness}
        strokeDasharray={dasharray}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${c} ${c})`}
      />
    );
  });

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="transparent"
          stroke="var(--color-surface-muted)"
          strokeWidth={thickness}
        />
        {arcs}
        <text
          x={c}
          y={c - 4}
          textAnchor="middle"
          className="fill-(--color-text-muted)"
          style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}
        >
          Totale
        </text>
        <text
          x={c}
          y={c + 14}
          textAnchor="middle"
          className="fill-(--color-text)"
          style={{ fontSize: 18, fontWeight: 500 }}
        >
          {formatValue ? formatValue(total) : total}
        </text>
      </svg>
      <ul className="flex-1 space-y-1 text-sm">
        {slices.map((s, i) => (
          <li key={s.label} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
            />
            <span className="text-(--color-text) truncate flex-1">
              {s.label}
            </span>
            <span className="text-(--color-text-muted) tabular-nums">
              {formatValue ? formatValue(s.value) : s.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
