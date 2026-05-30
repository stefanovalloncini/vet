import type { Attivita } from "@vet/shared";
import { mondayIndex, formatDate } from "../../../shared/lib/format";
import { ChartEmpty } from "./ChartEmpty";

interface HeatmapProps {
  items: Attivita[];
  weeks?: number;
  now?: Date;
}

const ITALIAN_DAYS = ["L", "M", "M", "G", "V", "S", "D"];

export function Heatmap({ items, weeks = 13, now = new Date() }: HeatmapProps) {
  const days = weeks * 7;
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const offset = mondayIndex(startOfDay);
  const lastDay = new Date(startOfDay);
  lastDay.setDate(startOfDay.getDate() + (6 - offset));
  const firstDay = new Date(lastDay);
  firstDay.setDate(lastDay.getDate() - days + 1);

  const counts = new Map<string, number>();
  let inRange = 0;
  for (const a of items) {
    if (a.data < firstDay) continue;
    const k = dayKey(a.data);
    counts.set(k, (counts.get(k) ?? 0) + 1);
    inRange += 1;
  }

  if (inRange === 0) return <ChartEmpty />;

  const max = Math.max(...counts.values(), 1);

  const grid: Array<Array<{ date: Date; count: number }>> = Array.from(
    { length: 7 },
    () => []
  );
  for (let i = 0; i < days; i++) {
    const d = new Date(firstDay);
    d.setDate(firstDay.getDate() + i);
    const dow = mondayIndex(d);
    const count = counts.get(dayKey(d)) ?? 0;
    grid[dow]!.push({ date: d, count });
  }

  const rangeLabel = `${firstDay.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
  })} – ${lastDay.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
  })}`;

  return (
    <div className="flex gap-2">
      <div
        aria-hidden="true"
        className="flex flex-col gap-[2px] text-[10px] text-(--color-text-subtle)"
      >
        {ITALIAN_DAYS.map((d, i) => (
          <span key={i} className="h-3 leading-3">
            {i % 2 === 0 ? d : ""}
          </span>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <div
          className="grid gap-[2px]"
          role="img"
          aria-label={`Mappa attività dal ${rangeLabel}, ${inRange} visite.`}
          style={{
            gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))`,
            gridAutoFlow: "column",
            gridTemplateRows: "repeat(7, 12px)",
          }}
        >
          {grid.flatMap((row, dow) =>
            row.map((cell) => {
              const intensity = cell.count === 0 ? 0 : cell.count / max;
              return (
                <span
                  key={`${dow}-${cell.date.toISOString()}`}
                  title={`${formatDate(cell.date)}: ${cell.count} visite`}
                  className="rounded-sm border border-(--color-border)/40"
                  style={{
                    backgroundColor:
                      cell.count === 0
                        ? "var(--color-surface-muted)"
                        : `color-mix(in oklab, var(--color-accent) ${Math.round(20 + intensity * 80)}%, transparent)`,
                  }}
                />
              );
            })
          )}
        </div>
        <p className="mt-1 flex justify-between text-[10px] tabular-nums text-(--color-text-subtle)">
          <span>
            {firstDay.toLocaleDateString("it-IT", {
              day: "numeric",
              month: "short",
            })}
          </span>
          <span>
            {lastDay.toLocaleDateString("it-IT", {
              day: "numeric",
              month: "short",
            })}
          </span>
        </p>
      </div>
    </div>
  );
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
