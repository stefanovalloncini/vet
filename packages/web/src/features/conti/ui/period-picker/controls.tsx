import { ChevronLeft, ChevronRight } from "lucide-react";
import { SHORT_MONTHS_IT } from "../../../../shared/i18n/months";
import {
  nextSelection,
  previousSelection,
  type PeriodSelection,
} from "../../lib/contoPreview";

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

export function StructuredControls({
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
