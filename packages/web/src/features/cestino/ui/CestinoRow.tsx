import type { Attivita } from "@vet/shared";
import { Badge, Button } from "../../../shared/ui";
import { formatDate, formatEuro } from "../../../shared/lib/format";
import { cestinoI18n as t } from "../i18n";

interface CestinoRowProps {
  attivita: Attivita;
  busy: boolean;
  canRestore: boolean;
  canPurge: boolean;
  selectable?: boolean;
  selected?: boolean;
  onSelectChange?: (next: boolean) => void;
  onRestore: () => void;
  onPurgeAsk: () => void;
}

export function CestinoRow({
  attivita: a,
  busy,
  canRestore,
  canPurge,
  selectable = false,
  selected = false,
  onSelectChange,
  onRestore,
  onPurgeAsk,
}: CestinoRowProps) {
  const canAct = canRestore || canPurge;
  const showCheckbox = selectable && canAct;

  return (
    <li className="px-4 py-3 sm:px-5 sm:py-4 flex items-start gap-3 sm:gap-4 hover:bg-(--color-surface-muted)/40 transition-colors">
      {showCheckbox ? (
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelectChange?.(e.target.checked)}
          className="mt-1.5 w-4 h-4 accent-(--color-accent) flex-shrink-0"
          aria-label={`Seleziona ${a.aziendaNome}`}
          disabled={busy}
        />
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
          <Badge tone="neutral">{t.tipoAttivita}</Badge>
          <span className="font-mono text-xs text-(--color-text-muted) tabular-nums">
            {formatDate(a.data)}
          </span>
          <h2 className="text-sm sm:text-base font-medium text-(--color-text) truncate">
            {a.aziendaNome}
          </h2>
          <span className="text-sm text-(--color-text-muted)">
            {a.tipoNome}
          </span>
          <span className="text-sm sm:text-base font-medium text-(--color-text) tabular-nums">
            {formatEuro(a.totale)}
          </span>
        </div>
        <p className="text-xs text-(--color-text-subtle) mt-1.5">
          {a.ownerName}
          {a.deletedAt ? ` · ${t.deletedAt} ${formatDate(a.deletedAt)}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {canRestore ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onRestore}
            disabled={busy}
          >
            {t.ripristina}
          </Button>
        ) : null}
        {canPurge ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onPurgeAsk}
            disabled={busy}
          >
            {t.elimina}
          </Button>
        ) : null}
      </div>
    </li>
  );
}
