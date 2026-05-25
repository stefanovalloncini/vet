import { useMemo, useState } from "react";
import { ClipboardList, Building2 } from "lucide-react";
import { AppShell, Card, CardSkeleton, InlineError, SectionLabel } from "../../../shared/ui";
import { dashboardI18n as t } from "../i18n";
import { formatEuro } from "../../../shared/lib/format";
import { TrailingBarChart } from "../../../shared/ui/charts/TrailingBarChart";
import { OnboardingBanner } from "../../onboarding/OnboardingBanner";
import { useDashboardStats, type DashboardStats } from "../hooks/useDashboardStats";
import { MetricCard } from "../../../shared/ui/charts/MetricCard";

import { MONTHS_IT } from "../../../shared/i18n/months";

function periodLabel(now: Date): string {
  const m = MONTHS_IT[now.getMonth()] ?? "";
  return `${m.charAt(0).toUpperCase() + m.slice(1)} ${now.getFullYear()}`;
}

export function DashboardPage() {
  const now = useMemo(() => new Date(), []);
  const stats = useDashboardStats(now);

  return (
    <AppShell>
      <header className="mb-6 flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl text-(--color-text)">{t.title}</h1>
          <p className="text-(--color-text-muted) mt-1 text-sm">{t.subtitle}</p>
        </div>
        <p className="hidden sm:block text-xs uppercase tracking-[0.12em] text-(--color-text-subtle) tabular-nums">
          {periodLabel(now)}
        </p>
      </header>

      <OnboardingBanner
        hasAziende={stats.aziende.length > 0}
        hasAttivita={stats.items.length > 0}
      />

      {stats.loading ? (
        <CardSkeleton rows={3} />
      ) : stats.isError ? (
        <InlineError>{t.loadError}</InlineError>
      ) : stats.items.length === 0 ? (
        <p className="text-sm text-(--color-text-muted) py-2">{t.noActivity}</p>
      ) : (
        <DashboardBody stats={stats} />
      )}
    </AppShell>
  );
}

type ChartMode = "attivita" | "incassi";

function DashboardBody({ stats }: { stats: DashboardStats }) {
  const [mode, setMode] = useState<ChartMode>("attivita");
  const chartValues = mode === "attivita" ? stats.trailing.counts : stats.trailing.totals;
  const formatValue =
    mode === "attivita" ? (v: number) => String(v) : (v: number) => formatEuro(v);
  return (
    <>
      <div className="grid grid-cols-2 gap-3 mb-4 auto-rows-fr">
        <MetricCard
          label={t.visiteMese}
          value={String(stats.thisMonth.count)}
          trend={stats.countDiff}
          icon={ClipboardList}
        />
        <MetricCard
          label={t.aziendeAttive}
          value={String(stats.aziendeAttiveCount)}
          icon={Building2}
        />
      </div>
      <Card>
        <div className="flex items-center justify-between gap-3 mb-3">
          <SectionLabel as="span">
            {mode === "attivita" ? "Attività ultimi 12 mesi" : "Incassi ultimi 12 mesi"}
          </SectionLabel>
          <ChartModeToggle mode={mode} onChange={setMode} />
        </div>
        <TrailingBarChart
          values={chartValues}
          labels={stats.trailing.labels}
          formatValue={formatValue}
          totalLabel={t.totaleAnno}
        />
      </Card>
    </>
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
      className="inline-flex rounded-full border border-(--color-border) bg-(--color-surface) text-xs"
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
        "px-3 py-1 rounded-full transition-colors",
        active
          ? "bg-(--color-accent) text-white"
          : "text-(--color-text-muted) hover:text-(--color-text)",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
