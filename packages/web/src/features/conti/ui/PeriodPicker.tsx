import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CadenzaFatturazione } from "@vet/shared";
import { TextField } from "../../../shared/ui";
import { SHORT_MONTHS_IT } from "../../../shared/i18n/months";
import {
  dateInputValue,
  parseDateInput,
} from "../../../shared/lib/format";
import {
  detectPeriodSelection,
  nextSelection,
  previousFor,
  previousSelection,
  rangeForSelection,
  selectionFromNow,
  selectionLabel,
  type PeriodKind,
  type PeriodSelection,
} from "../lib/contoPreview";

const KIND_TABS: ReadonlyArray<{ value: PeriodKind; label: string }> = [
  { value: "monthly", label: "Mese" },
  { value: "quarterly", label: "Trimestre" },
  { value: "semiannual", label: "Semestre" },
  { value: "annual", label: "Anno" },
  { value: "custom", label: "Personalizzato" },
];

const QUARTERS: ReadonlyArray<{ index: number; label: string; sub: string }> = [
  { index: 1, label: "T1", sub: "gen–mar" },
  { index: 2, label: "T2", sub: "apr–giu" },
  { index: 3, label: "T3", sub: "lug–set" },
  { index: 4, label: "T4", sub: "ott–dic" },
];

const SEMESTERS: ReadonlyArray<{ index: number; label: string; sub: string }> = [
  { index: 1, label: "S1", sub: "gen–giu" },
  { index: 2, label: "S2", sub: "lug–dic" },
];

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

function KindTabs({
  current,
  onPick,
}: {
  current: PeriodKind;
  onPick: (k: PeriodKind) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Tipo di periodo"
      className="flex flex-wrap gap-1.5"
    >
      {KIND_TABS.map((t) => {
        const active = t.value === current;
        return (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onPick(t.value)}
            className={[
              "inline-flex min-h-9 items-center rounded-full px-3 text-xs transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-2",
              active
                ? "bg-(--color-accent-soft) text-(--color-accent) border border-(--color-accent)"
                : "border border-(--color-border) text-(--color-text-muted) hover:text-(--color-text) hover:border-(--color-border-strong)",
            ].join(" ")}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function StructuredControls({
  selection,
  onSelectionChange,
  today,
}: {
  selection: PeriodSelection;
  onSelectionChange: (sel: PeriodSelection) => void;
  today: Date;
}) {
  const year = Number.isFinite(selection.year) && selection.year > 0
    ? selection.year
    : today.getFullYear();
  return (
    <div className="space-y-2.5">
      <YearStepper
        year={year}
        onYearChange={(y) => onSelectionChange({ ...selection, year: y })}
        onStepBack={() => onSelectionChange(previousSelection({ ...selection, year }))}
        onStepForward={() => onSelectionChange(nextSelection({ ...selection, year }))}
      />
      {selection.kind === "monthly" ? (
        <MonthGrid
          year={year}
          activeIndex={selection.index}
          onPick={(idx) =>
            onSelectionChange({ kind: "monthly", year, index: idx })
          }
        />
      ) : null}
      {selection.kind === "quarterly" ? (
        <IndexButtons
          items={QUARTERS}
          activeIndex={selection.index}
          onPick={(idx) =>
            onSelectionChange({ kind: "quarterly", year, index: idx })
          }
        />
      ) : null}
      {selection.kind === "semiannual" ? (
        <IndexButtons
          items={SEMESTERS}
          activeIndex={selection.index}
          onPick={(idx) =>
            onSelectionChange({ kind: "semiannual", year, index: idx })
          }
        />
      ) : null}
    </div>
  );
}

interface YearStepperProps {
  year: number;
  onYearChange: (y: number) => void;
  onStepBack: () => void;
  onStepForward: () => void;
}

function YearStepper({
  year,
  onYearChange,
  onStepBack,
  onStepForward,
}: YearStepperProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Periodo precedente"
        onClick={onStepBack}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-(--color-border) text-(--color-text-muted) hover:text-(--color-text) hover:border-(--color-border-strong) transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-2"
      >
        <ChevronLeft size={16} strokeWidth={1.75} aria-hidden="true" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        aria-label="Anno"
        value={year}
        min={1970}
        max={2100}
        step={1}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (Number.isInteger(v) && v >= 1970 && v <= 2100) onYearChange(v);
        }}
        className="w-20 h-9 px-2 text-sm text-center tabular-nums rounded-md border border-(--color-border) bg-(--color-surface) text-(--color-text) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-2"
      />
      <button
        type="button"
        aria-label="Periodo successivo"
        onClick={onStepForward}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-(--color-border) text-(--color-text-muted) hover:text-(--color-text) hover:border-(--color-border-strong) transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-2"
      >
        <ChevronRight size={16} strokeWidth={1.75} aria-hidden="true" />
      </button>
    </div>
  );
}

interface IndexItem {
  index: number;
  label: string;
  sub: string;
}

function IndexButtons({
  items,
  activeIndex,
  onPick,
}: {
  items: ReadonlyArray<IndexItem>;
  activeIndex: number;
  onPick: (idx: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it) => {
        const active = it.index === activeIndex;
        return (
          <button
            key={it.index}
            type="button"
            aria-pressed={active}
            onClick={() => onPick(it.index)}
            className={[
              "flex min-w-16 flex-col items-center justify-center gap-0.5 rounded-md px-3 py-1.5 text-xs transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-2",
              active
                ? "bg-(--color-accent-soft) text-(--color-accent) border border-(--color-accent)"
                : "border border-(--color-border) text-(--color-text-muted) hover:text-(--color-text) hover:border-(--color-border-strong)",
            ].join(" ")}
          >
            <span className="font-medium tabular-nums">{it.label}</span>
            <span className="text-[10px] text-(--color-text-subtle) tabular-nums">
              {it.sub}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function MonthGrid({
  year,
  activeIndex,
  onPick,
}: {
  year: number;
  activeIndex: number;
  onPick: (idx: number) => void;
}) {
  return (
    <div className="grid grid-cols-6 gap-1.5">
      {SHORT_MONTHS_IT.map((label, i) => {
        const idx = i + 1;
        const active = idx === activeIndex;
        return (
          <button
            key={idx}
            type="button"
            aria-pressed={active}
            aria-label={`${label} ${year}`}
            onClick={() => onPick(idx)}
            className={[
              "inline-flex min-h-9 items-center justify-center rounded-md px-2 text-xs transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-2",
              active
                ? "bg-(--color-accent-soft) text-(--color-accent) border border-(--color-accent)"
                : "border border-(--color-border) text-(--color-text-muted) hover:text-(--color-text) hover:border-(--color-border-strong)",
            ].join(" ")}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function CustomFields({
  from,
  to,
  onFromChange,
  onToChange,
}: {
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <TextField
        id="period-from"
        type="date"
        label="Da"
        value={from}
        onChange={(e) => onFromChange(e.target.value)}
      />
      <TextField
        id="period-to"
        type="date"
        label="A"
        value={to}
        onChange={(e) => onToChange(e.target.value)}
      />
    </div>
  );
}

function QuickShortcuts({
  today,
  cadenza,
  onPick,
}: {
  today: Date;
  cadenza?: CadenzaFatturazione;
  onPick: (sel: PeriodSelection) => void;
}) {
  const shortcuts: Array<{ key: string; label: string; sel: PeriodSelection }> = [
    {
      key: "prev-month",
      label: "Mese scorso",
      sel: previousFor("monthly", today),
    },
    {
      key: "prev-quarter",
      label: "Trimestre scorso",
      sel: previousFor("quarterly", today),
    },
    {
      key: "prev-semester",
      label: "Semestre scorso",
      sel: previousFor("semiannual", today),
    },
    {
      key: "prev-year",
      label: "Anno scorso",
      sel: { kind: "annual", year: today.getFullYear() - 1, index: 0 },
    },
  ];
  const sorted = cadenza
    ? [
        ...shortcuts.filter(
          (s) =>
            (cadenza === "monthly" && s.key === "prev-month") ||
            (cadenza === "quarterly" && s.key === "prev-quarter") ||
            (cadenza === "semiannual" && s.key === "prev-semester")
        ),
        ...shortcuts.filter(
          (s) =>
            !(cadenza === "monthly" && s.key === "prev-month") &&
            !(cadenza === "quarterly" && s.key === "prev-quarter") &&
            !(cadenza === "semiannual" && s.key === "prev-semester")
        ),
      ]
    : shortcuts;
  return (
    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-(--color-border)">
      {sorted.map((s) => (
        <button
          key={s.key}
          type="button"
          onClick={() => onPick(s.sel)}
          className="inline-flex min-h-8 items-center rounded-full border border-(--color-border) px-2.5 text-[11px] text-(--color-text-muted) transition-colors hover:text-(--color-text) hover:border-(--color-border-strong) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-2"
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

function defaultSelection(
  cadenza: CadenzaFatturazione | undefined,
  now: Date
): PeriodSelection {
  if (cadenza) return previousFor(cadenza, now);
  return previousFor("quarterly", now);
}

function coerceSelection(
  year: number,
  kind: PeriodKind,
  now: Date
): PeriodSelection {
  if (kind === "monthly")
    return { kind, year, index: now.getMonth() + 1 };
  if (kind === "quarterly")
    return { kind, year, index: Math.floor(now.getMonth() / 3) + 1 };
  if (kind === "semiannual")
    return { kind, year, index: now.getMonth() < 6 ? 1 : 2 };
  if (kind === "annual") return { kind, year, index: 0 };
  return { kind: "custom", year, index: 0 };
}
