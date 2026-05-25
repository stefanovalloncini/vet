import { Button, TextField } from "../../../shared/ui";
import { riepilogoI18n as t } from "../i18n";

interface RiepilogoFiltersProps {
  onBack: () => void;
  onPrint: () => void;
  onShareWhatsApp: () => void;
  canShare: boolean;
  from: string;
  to: string;
  onPeriodChange: (key: "from" | "to", value: string) => void;
}

export function RiepilogoFilters({
  onBack,
  onPrint,
  onShareWhatsApp,
  canShare,
  from,
  to,
  onPeriodChange,
}: RiepilogoFiltersProps) {
  return (
    <div className="mb-8 print:hidden space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
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
      <div className="grid grid-cols-2 gap-3 max-w-md">
        <TextField
          id="riepilogo-from"
          type="date"
          label="Da"
          value={from}
          onChange={(e) => onPeriodChange("from", e.target.value)}
        />
        <TextField
          id="riepilogo-to"
          type="date"
          label="A"
          value={to}
          onChange={(e) => onPeriodChange("to", e.target.value)}
        />
      </div>
    </div>
  );
}
