import { Printer, Share2 } from "lucide-react";
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
    <div className="mb-6 print:hidden">
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-(--color-text-muted) hover:text-(--color-text) transition-colors duration-(--motion-fast) inline-flex items-center gap-1.5"
      >
        <span aria-hidden="true">←</span>
        <span>{t.back}</span>
      </button>
      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid grid-cols-2 gap-3 max-w-md">
          <TextField
            id="riepilogo-from"
            type="date"
            label={t.filtroDa}
            value={from}
            onChange={(e) => onPeriodChange("from", e.target.value)}
          />
          <TextField
            id="riepilogo-to"
            type="date"
            label={t.filtroA}
            value={to}
            onChange={(e) => onPeriodChange("to", e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canShare ? (
            <Button
              type="button"
              variant="secondary"
              onClick={onShareWhatsApp}
              leadingIcon={<Share2 size={14} strokeWidth={1.75} aria-hidden="true" />}
            >
              WhatsApp
            </Button>
          ) : null}
          <Button
            type="button"
            variant="primary"
            onClick={onPrint}
            leadingIcon={<Printer size={14} strokeWidth={1.75} aria-hidden="true" />}
          >
            {t.stampa}
          </Button>
        </div>
      </div>
    </div>
  );
}
