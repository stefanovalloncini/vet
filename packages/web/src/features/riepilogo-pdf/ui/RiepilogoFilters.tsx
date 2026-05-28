import { Printer, Share2 } from "lucide-react";
import type { CadenzaFatturazione } from "@vet/shared";
import { Button } from "../../../shared/ui";
import { PeriodPicker } from "../../conti";
import { dateInputValue } from "../../../shared/lib/format";
import { riepilogoI18n as t } from "../i18n";

interface RiepilogoFiltersProps {
  onBack: () => void;
  onPrint: () => void;
  onShareWhatsApp: () => void;
  canShare: boolean;
  from: string;
  to: string;
  onPeriodChange: (key: "from" | "to", value: string) => void;
  onPeriodRange?: (from: Date, to: Date) => void;
  cadenza?: CadenzaFatturazione;
}

export function RiepilogoFilters({
  onBack,
  onPrint,
  onShareWhatsApp,
  canShare,
  from,
  to,
  onPeriodChange,
  onPeriodRange,
  cadenza,
}: RiepilogoFiltersProps) {
  function handleRange(nextFrom: Date, nextTo: Date): void {
    if (onPeriodRange) {
      onPeriodRange(nextFrom, nextTo);
      return;
    }
    onPeriodChange("from", dateInputValue(nextFrom));
    onPeriodChange("to", dateInputValue(nextTo));
  }

  return (
    <div className="mb-6 print:hidden">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm text-(--color-text-muted) transition-colors duration-(--motion-fast) ease-(--ease-out-quart) hover:text-(--color-text) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-2"
      >
        <span aria-hidden="true">←</span>
        <span>{t.back}</span>
      </button>

      <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1 max-w-xl">
          <PeriodPicker
            from={from}
            to={to}
            onChange={handleRange}
            onCustomFromChange={(v) => onPeriodChange("from", v)}
            onCustomToChange={(v) => onPeriodChange("to", v)}
            {...(cadenza ? { cadenza } : {})}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap lg:flex-shrink-0">
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
