import { useMemo } from "react";
import type { CadenzaFatturazione } from "@vet/shared";
import { dateInputValue, parseDateInput } from "../../../shared/lib/format";
import {
  detectPeriodSelection,
  previousSelection,
  rangeForSelection,
  selectionFromNow,
  selectionLabel,
  type PeriodKind,
  type PeriodSelection,
} from "../lib/contoPreview";
import { coerceSelection, defaultSelection } from "./period-picker/selection";
import { StructuredControls } from "./period-picker/controls";
import { CustomFields, KindTabs, QuickShortcuts } from "./period-picker/extras";

interface PeriodPickerProps {
  from: string;
  to: string;
  onChange: (from: Date, to: Date) => void;
  onCustomFromChange: (value: string) => void;
  onCustomToChange: (value: string) => void;
  cadenza?: CadenzaFatturazione;
  now?: Date;
}

export function PeriodPicker({
  from,
  to,
  onChange,
  onCustomFromChange,
  onCustomToChange,
  cadenza,
  now,
}: PeriodPickerProps) {
  const today = useMemo(() => now ?? new Date(), [now]);
  const fromDate = parseDateInput(from);
  const toDate = parseDateInput(to);

  const detected: PeriodSelection = useMemo(() => {
    if (!fromDate || !toDate) {
      return defaultSelection(cadenza, today);
    }
    return detectPeriodSelection(fromDate, toDate);
  }, [fromDate, toDate, cadenza, today]);

  function applySelection(sel: PeriodSelection): void {
    if (sel.kind === "custom") return;
    const r = rangeForSelection(sel);
    onChange(r.from, r.to);
  }

  function setKind(kind: PeriodKind): void {
    if (kind === "custom") {
      if (!from) onCustomFromChange(fromDate ? dateInputValue(fromDate) : "");
      if (!to) onCustomToChange(toDate ? dateInputValue(toDate) : "");
      return;
    }
    if (detected.kind === kind) return;
    const seed =
      Number.isFinite(detected.year) && detected.year > 0
        ? coerceSelection(detected.year, kind, today)
        : selectionFromNow(kind, today);
    applySelection(previousSelection(seed));
  }

  return (
    <div className="space-y-3">
      <KindTabs current={detected.kind} onPick={setKind} />

      {detected.kind !== "custom" ? (
        <StructuredControls
          selection={detected}
          onSelectionChange={applySelection}
          today={today}
        />
      ) : null}

      <CustomFields
        from={from}
        to={to}
        onFromChange={onCustomFromChange}
        onToChange={onCustomToChange}
      />

      <QuickShortcuts
        today={today}
        {...(cadenza ? { cadenza } : {})}
        onPick={applySelection}
      />

      <p className="text-xs text-(--color-text-subtle) tabular-nums">
        Periodo:{" "}
        <span className="text-(--color-text-muted)">
          {selectionLabel(detected)}
        </span>
      </p>
    </div>
  );
}
