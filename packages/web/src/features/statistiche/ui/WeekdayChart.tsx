import type { Attivita } from "@vet/shared";

const LABELS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

interface WeekdayChartProps {
  items: Attivita[];
}

export function WeekdayChart({ items }: WeekdayChartProps) {
  const buckets = new Array(7).fill(0);
  for (const a of items) {
    const dow = (a.data.getDay() + 6) % 7;
    buckets[dow] += 1;
  }
  const max = Math.max(...buckets, 1);
  return (
    <div className="flex items-end gap-2 h-32">
      {buckets.map((n: number, i: number) => {
        const h = Math.max(2, Math.round((n / max) * 100));
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] text-(--color-text-subtle) tabular-nums">
              {n}
            </span>
            <div
              className="w-full rounded-sm"
              style={{
                height: `${h}%`,
                backgroundColor:
                  "color-mix(in oklab, var(--color-accent) " +
                  Math.max(25, Math.round(50 + (n / max) * 50)) +
                  "%, transparent)",
              }}
            />
            <span className="text-[10px] text-(--color-text-muted)">
              {LABELS[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
