import { Link } from "react-router-dom";
import { Card } from "../../../shared/ui";
import { formatDate, formatEuro } from "../lib/format";
import type { Attivita } from "@vet/shared";

export function AttivitaRow({ attivita: a }: { attivita: Attivita }) {
  return (
    <Link to={`/attivita/${a.id}`} className="block">
      <Card className="hover:border-(--color-border-strong) transition-colors">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-sm text-(--color-text-muted) tabular-nums">
                {formatDate(a.data)}
              </span>
              <h2 className="text-base font-medium text-(--color-text) truncate">
                {a.aziendaNome}
              </h2>
              <span className="text-sm text-(--color-text-muted)">
                {a.tipoNome}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-(--color-text-subtle)">
              <span>{a.ownerName}</span>
              {a.oraria && a.ore !== undefined ? (
                <span>
                  {formatEuro(a.tariffa)}/h × {a.ore}h
                </span>
              ) : null}
              {a.note ? <span className="truncate">{a.note}</span> : null}
            </div>
          </div>
          <span className="text-base font-medium text-(--color-text) tabular-nums flex-shrink-0">
            {formatEuro(a.totale)}
          </span>
        </div>
      </Card>
    </Link>
  );
}
