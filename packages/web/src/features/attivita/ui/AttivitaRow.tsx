import { Link } from "react-router-dom";
import { formatDate, formatEuro } from "../../../shared/lib/format";
import type { Attivita } from "@vet/shared";

const oreFormatter = new Intl.NumberFormat("it-IT", {
  maximumFractionDigits: 2,
});

export function AttivitaRow({ attivita: a }: { attivita: Attivita }) {
  return (
    <Link
      to={`/attivita/${a.id}`}
      className="flex items-start justify-between gap-3 px-4 py-3 min-h-[56px] hover:bg-(--color-surface-muted) transition-colors focus:outline-none focus-visible:bg-(--color-surface-muted)"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-sm text-(--color-text-muted) tabular-nums shrink-0">
            {formatDate(a.data)}
          </span>
          <h2 className="text-base font-medium text-(--color-text) truncate min-w-0">
            {a.aziendaNome}
          </h2>
        </div>
        <div className="text-sm text-(--color-text-muted) mt-0.5 truncate">
          {a.tipoNome}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-(--color-text-subtle)">
          <span className="truncate max-w-[14ch]">{a.ownerName}</span>
          {a.oraria && a.ore !== undefined ? (
            <span className="tabular-nums shrink-0">
              {formatEuro(a.tariffa)}/h × {oreFormatter.format(a.ore)}h
            </span>
          ) : null}
        </div>
        {a.note ? (
          <p className="text-xs text-(--color-text-subtle) mt-1 line-clamp-2 break-words">
            {a.note}
          </p>
        ) : null}
      </div>
      <span className="text-base font-medium text-(--color-text) tabular-nums shrink-0 self-center">
        {formatEuro(a.totale)}
      </span>
    </Link>
  );
}
