import type { CadenzaFatturazione } from "@vet/shared";
import { TextField } from "../../../../shared/ui";
import {
  previousFor,
  type PeriodKind,
  type PeriodSelection,
} from "../../lib/contoPreview";

const KIND_TABS: ReadonlyArray<{ value: PeriodKind; label: string }> = [
  { value: "monthly", label: "Mese" },
  { value: "quarterly", label: "Trimestre" },
  { value: "semiannual", label: "Semestre" },
  { value: "annual", label: "Anno" },
  { value: "custom", label: "Personalizzato" },
];

export function KindTabs({
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

export function CustomFields({
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

export function QuickShortcuts({
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
