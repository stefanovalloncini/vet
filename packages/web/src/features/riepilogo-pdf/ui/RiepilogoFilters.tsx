import { Button } from "../../../shared/ui";
import { riepilogoI18n as t } from "../i18n";

interface RiepilogoFiltersProps {
  onBack: () => void;
  onPrint: () => void;
  onShareWhatsApp: () => void;
  canShare: boolean;
}

export function RiepilogoFilters({
  onBack,
  onPrint,
  onShareWhatsApp,
  canShare,
}: RiepilogoFiltersProps) {
  return (
    <div className="flex items-center justify-between mb-8 print:hidden gap-3 flex-wrap">
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-(--color-text-muted) hover:text-(--color-text)"
      >
        ← {t.back}
      </button>
      <div className="flex items-center gap-2">
        {canShare ? (
          <Button type="button" variant="secondary" onClick={onShareWhatsApp}>
            WhatsApp
          </Button>
        ) : null}
        <Button type="button" variant="primary" onClick={onPrint}>
          {t.stampa}
        </Button>
      </div>
    </div>
  );
}
