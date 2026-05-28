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
  const aziendaNome = a.aziendaNome?.trim() ? a.aziendaNome : t.aziendaSconosciuta;

  return (
    <div className="bg-(--color-surface) border border-(--color-border) rounded-2xl px-4 py-3 sm:px-5 sm:py-4 flex items-start gap-3 sm:gap-4 hover:bg-(--color-surface-muted)/40 transition-colors">
      {showCheckbox ? (
        <label className="-m-2 p-2 mt-0.5 flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelectChange?.(e.target.checked)}
            className="w-4 h-4 accent-(--color-accent)"
            aria-label={`${t.seleziona} ${aziendaNome}`}
            disabled={busy}
          />
        </label>
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge tone="neutral">{t.tipoAttivita}</Badge>
          <span className="font-mono text-xs text-(--color-text-muted) tabular-nums">
            {formatDate(a.data)}
          </span>
        </div>
        <div className="mt-1.5 flex items-baseline justify-between gap-3">
          <h2 className="text-sm sm:text-base font-medium text-(--color-text) break-words min-w-0">
            {aziendaNome}
          </h2>
          <span className="text-sm sm:text-base font-medium text-(--color-text) tabular-nums shrink-0">
            {formatEuro(a.totale)}
          </span>
        </div>
        <p className="text-xs text-(--color-text-muted) mt-1 break-words">
          {a.tipoNome}
        </p>
        <p className="text-xs text-(--color-text-subtle) mt-1 break-words">
          {a.ownerName?.trim() ? a.ownerName : t.proprietarioSconosciuto}
          {a.deletedAt ? ` · ${t.deletedAt} ${formatDate(a.deletedAt)}` : ""}
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 shrink-0">
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
    </div>
  );
}
