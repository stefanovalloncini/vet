import { useMemo } from "react";
import { Link } from "react-router-dom";
import { groupByZone } from "../lib/zones";
import type { Azienda } from "@vet/shared";
import { ChartEmpty } from "./ChartEmpty";

interface ZonePanelProps {
  aziende: Azienda[];
}

export function ZonePanel({ aziende }: ZonePanelProps) {
  const zones = useMemo(() => groupByZone(aziende).slice(0, 8), [aziende]);
  if (zones.length === 0) return <ChartEmpty label="Nessuna azienda da raggruppare." />;

  return (
    <div className="space-y-3">
      {zones.map((z) => (
        <div key={z.name}>
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-sm font-medium text-(--color-text)">
              {z.name}
            </span>
            <span className="text-xs text-(--color-text-muted) tabular-nums">
              {z.aziende.length}{" "}
              {z.aziende.length === 1 ? "azienda" : "aziende"}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {z.aziende.map((a) => (
              <Link
                key={a.id}
                to={`/aziende/${a.id}`}
                className="max-w-full truncate rounded-md bg-(--color-surface-muted) px-2 py-1 text-xs text-(--color-text-muted) transition-colors duration-(--motion-fast) ease-(--ease-out-quart) hover:bg-(--color-accent-soft) hover:text-(--color-text) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-1"
              >
                {a.nome}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
