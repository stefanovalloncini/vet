import type { Attivita } from "@vet/shared";
import { Button, Card } from "../../../shared/ui";
import { formatDate, formatEuro } from "../../attivita/lib/format";
import { cestinoI18n as t } from "../i18n";

interface CestinoRowProps {
  attivita: Attivita;
  busy: boolean;
  canRestore: boolean;
  canPurge: boolean;
  onRestore: () => void;
  onPurgeAsk: () => void;
}

export function CestinoRow({
  attivita: a,
  busy,
  canRestore,
  canPurge,
  onRestore,
  onPurgeAsk,
}: CestinoRowProps) {
  return (
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
            <span className="text-base font-medium text-(--color-text) tabular-nums">
              {formatEuro(a.totale)}
            </span>
          </div>
          <p className="text-xs text-(--color-text-subtle) mt-2">
            {a.ownerName}
            {a.deletedAt ? ` · ${t.deletedAt} ${formatDate(a.deletedAt)}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
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
    </Card>
  );
}
