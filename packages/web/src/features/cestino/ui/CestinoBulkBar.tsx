import { Button } from "../../../shared/ui";
import { cestinoI18n as t } from "../i18n";

interface CestinoBulkBarProps {
  total: number;
  selectionCount: number;
  allSelected: boolean;
  busy: boolean;
  canBulkRestore: boolean;
  canBulkPurge: boolean;
  onSelectAll: (next: boolean) => void;
  onRestore: () => void;
  onPurgeAsk: () => void;
}

export function CestinoBulkBar({
  total,
  selectionCount,
  allSelected,
  busy,
  canBulkRestore,
  canBulkPurge,
  onSelectAll,
  onRestore,
  onPurgeAsk,
}: CestinoBulkBarProps) {
  const hasSelection = selectionCount > 0;
  return (
    <div
      role="toolbar"
      aria-label="Azioni cestino"
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 rounded-xl border border-(--color-border) bg-(--color-surface)"
    >
      <label className="inline-flex items-center gap-3 text-sm text-(--color-text) cursor-pointer select-none">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={(e) => onSelectAll(e.target.checked)}
          className="w-4 h-4 accent-(--color-accent)"
          aria-label={allSelected ? t.deseleziona : t.selezionaTutto}
          disabled={busy}
        />
        <span className="font-medium">
          {hasSelection ? t.selezionate(selectionCount) : t.contatore(total)}
        </span>
      </label>
      <div className="flex items-center gap-2">
        {canBulkRestore ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onRestore}
            disabled={busy || !hasSelection}
          >
            {t.ripristinaSelezionati}
          </Button>
        ) : null}
        {canBulkPurge ? (
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={onPurgeAsk}
            disabled={busy || !hasSelection}
          >
            {t.eliminaSelezionati}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
