interface SparklineProps {
  values: number[];
  labels?: string[];
  width?: number;
  height?: number;
  className?: string;
}

export function Sparkline({
  values,
  labels = [],
  width = 320,
  height = 60,
  className = "",
}: SparklineProps) {
  if (values.length === 0) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const step = values.length > 1 ? width / (values.length - 1) : width;

  const points = values
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const last = values[values.length - 1] ?? 0;
  const lastX = (values.length - 1) * step;
  const lastY = height - ((last - min) / range) * height;

  return (
    <div className={className}>
      <svg
        viewBox={`0 -8 ${width} ${height + 16}`}
        width="100%"
        height={height}
        preserveAspectRatio="none"
        className="block"
      >
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-(--color-accent)"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx={lastX}
          cy={lastY}
          r="3"
          className="fill-(--color-accent)"
        />
      </svg>
      {labels.length === values.length ? (
        <div className="flex justify-between text-[10px] text-(--color-text-subtle) mt-1 px-0.5">
          <span>{labels[0]}</span>
          <span>{labels[labels.length - 1]}</span>
        </div>
      ) : null}
    </div>
  );
}
