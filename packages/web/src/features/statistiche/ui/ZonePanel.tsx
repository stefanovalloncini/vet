import { useMemo } from "react";
import { Link } from "react-router-dom";
import { groupByZone } from "../lib/zones";
import type { Azienda } from "@vet/shared";

interface ZonePanelProps {
  aziende: Azienda[];
}

export function ZonePanel({ aziende }: ZonePanelProps) {
  const zones = useMemo(() => groupByZone(aziende).slice(0, 8), [aziende]);
  if (zones.length === 0) return null;

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
                className="text-xs px-2 py-0.5 rounded-md bg-(--color-surface-muted) text-(--color-text-muted) hover:text-(--color-text) hover:bg-(--color-accent-soft) transition-colors"
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
