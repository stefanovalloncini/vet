import type { Attivita } from "@vet/shared";
import { WEEKDAYS_IT as WEEKDAYS } from "../../../shared/i18n/months";
import { ChartEmpty } from "./ChartEmpty";

interface WeekdayChartProps {
  items: Attivita[];
}

export function WeekdayChart({ items }: WeekdayChartProps) {
  const buckets = new Array<number>(7).fill(0);
  for (const a of items) {
    const dow = (a.data.getDay() + 6) % 7;
    buckets[dow] = (buckets[dow] ?? 0) + 1;
  }
  const total = buckets.reduce((s, n) => s + n, 0);
  if (total === 0) return <ChartEmpty />;
  const max = Math.max(...buckets, 1);
  const summary = buckets
    .map((n, i) => `${WEEKDAYS[i]} ${n}`)
    .join(", ");
  return (
    <div
      className="flex h-32 items-end gap-1.5 sm:gap-2"
      role="img"
      aria-label={`Visite per giorno della settimana: ${summary}.`}
    >
      {buckets.map((n, i) => {
        const h = Math.max(2, Math.round((n / max) * 100));
        const mix = Math.max(25, Math.round(50 + (n / max) * 50));
        return (
          <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <span className="text-[10px] tabular-nums text-(--color-text-subtle)">
              {n}
            </span>
            <div
              className="w-full rounded-sm"
              style={{
                height: `${h}%`,
                backgroundColor: `color-mix(in oklab, var(--color-accent) ${mix}%, transparent)`,
              }}
            />
            <span className="text-[10px] text-(--color-text-muted)">
              {WEEKDAYS[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
