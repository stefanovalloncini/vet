import { useState } from "react";
import { Card, SectionLabel } from "../../../shared/ui";
import { TrailingBarChart } from "../../../shared/ui/charts/TrailingBarChart";
import { formatEuro } from "../../../shared/lib/format";
import { dashboardI18n as t } from "../i18n";
import type { DashboardStats } from "../hooks/useDashboardStats";

type ChartMode = "attivita" | "incassi";

interface ChartPanelProps {
  trailing: DashboardStats["trailing"];
  className?: string;
}

export function ChartPanel({ trailing, className = "" }: ChartPanelProps) {
  const [mode, setMode] = useState<ChartMode>("attivita");
  const values = mode === "attivita" ? trailing.counts : trailing.totals;
  const formatValue =
    mode === "attivita" ? (v: number) => String(v) : (v: number) => formatEuro(v);
  return (
    <Card className={className}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <SectionLabel as="span">
          {mode === "attivita" ? t.chartTitleAttivita : t.chartTitleIncassi}
        </SectionLabel>
        <ChartModeToggle mode={mode} onChange={setMode} />
      </div>
      <TrailingBarChart
        values={values}
        labels={trailing.labels}
        formatValue={formatValue}
        totalLabel={t.totaleAnno}
      />
    </Card>
  );
}

interface ChartModeToggleProps {
  mode: ChartMode;
  onChange: (next: ChartMode) => void;
}

function ChartModeToggle({ mode, onChange }: ChartModeToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Vista grafico"
      className="inline-flex rounded-md border border-(--color-border) bg-(--color-surface-muted) p-0.5 text-xs"
    >
      <ToggleOption
        active={mode === "attivita"}
        label={t.toggleAttivita}
        onClick={() => onChange("attivita")}
      />
      <ToggleOption
        active={mode === "incassi"}
        label={t.toggleIncassi}
        onClick={() => onChange("incassi")}
      />
    </div>
  );
}

function ToggleOption({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={[
        "min-h-9 rounded-md px-3 py-1.5 transition-colors duration-(--motion-fast) ease-(--ease-out-quart)",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-1",
        active
          ? "bg-(--color-surface) text-(--color-text) font-medium shadow-[0_1px_2px_oklch(20%_0.012_240/0.06)]"
          : "text-(--color-text-muted) hover:text-(--color-text)",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
