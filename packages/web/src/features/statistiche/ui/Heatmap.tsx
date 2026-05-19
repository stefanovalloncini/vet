import type { Attivita } from "@vet/shared";

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
  const offset = (startOfDay.getDay() + 6) % 7;
  const lastDay = new Date(startOfDay);
  lastDay.setDate(startOfDay.getDate() + (6 - offset));
  const firstDay = new Date(lastDay);
  firstDay.setDate(lastDay.getDate() - days + 1);

  const counts = new Map<string, number>();
  for (const a of items) {
    if (a.data < firstDay) continue;
    const k = dayKey(a.data);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }

  const max = Math.max(...counts.values(), 1);

  const grid: Array<Array<{ date: Date; count: number }>> = Array.from(
    { length: 7 },
    () => []
  );
  for (let i = 0; i < days; i++) {
    const d = new Date(firstDay);
    d.setDate(firstDay.getDate() + i);
    const dow = (d.getDay() + 6) % 7;
    const count = counts.get(dayKey(d)) ?? 0;
    grid[dow]!.push({ date: d, count });
  }

  return (
    <div className="flex gap-2">
      <div className="flex flex-col gap-[2px] text-[10px] text-(--color-text-subtle)">
        {ITALIAN_DAYS.map((d, i) => (
          <span key={i} className="h-3 leading-3">
            {i % 2 === 0 ? d : ""}
          </span>
        ))}
      </div>
      <div className="flex-1">
        <div
          className="grid gap-[2px]"
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
                  title={`${cell.date.toLocaleDateString("it-IT")}: ${cell.count} visite`}
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
        <p className="text-[10px] text-(--color-text-subtle) mt-1 flex justify-between">
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
