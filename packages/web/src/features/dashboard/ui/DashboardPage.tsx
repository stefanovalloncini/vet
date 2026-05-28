import { useMemo, useState } from "react";
import { AppShell, Card, EmptyState, InlineError, SectionLabel, Skeleton } from "../../../shared/ui";
import { dashboardI18n as t } from "../i18n";
import { formatEuro } from "../../../shared/lib/format";
import { TrailingBarChart } from "../../../shared/ui/charts/TrailingBarChart";
import { Onboarding } from "../../onboarding";
import { OnboardingBanner } from "../../onboarding/OnboardingBanner";
import { useDashboardStats, type DashboardStats } from "../hooks/useDashboardStats";

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
      <header className="mb-6 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-(--color-text)">
            {t.title}
          </h1>
          <p className="text-(--color-text-muted) mt-1.5 text-sm">{t.subtitle}</p>
        </div>
        <p className="hidden sm:block shrink-0 text-xs uppercase tracking-[0.12em] text-(--color-text-subtle) tabular-nums">
          {periodLabel(now)}
        </p>
      </header>

      <Onboarding />
      <OnboardingBanner
        hasAziende={stats.aziende.length > 0}
        hasAttivita={stats.items.length > 0}
      />

      {stats.loading ? (
        <DashboardSkeleton />
      ) : stats.isError ? (
        <InlineError>{t.loadError}</InlineError>
      ) : stats.items.length === 0 ? (
        <DashboardEmpty />
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
      <div className="grid grid-cols-2 gap-3 mb-6">
        <KpiCard label={t.visiteMese} value={String(stats.thisMonth.count)} />
        <KpiCard
          label={t.aziendeAttive}
          value={String(stats.aziendeAttiveCount)}
        />
      </div>
      <Card>
        <div className="flex items-center justify-between gap-3 mb-3">
          <SectionLabel as="span">
            {mode === "attivita" ? t.chartTitleAttivita : t.chartTitleIncassi}
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

interface KpiCardProps {
  label: string;
  value: string;
}

function KpiCard({ label, value }: KpiCardProps) {
  return (
    <Card className="flex flex-col gap-3">
      <p className="text-sm text-(--color-text-muted)">{label}</p>
      <p
        className="font-semibold tabular-nums text-(--color-text) text-3xl leading-none"
        aria-live="polite"
      >
        {value}
      </p>
    </Card>
  );
}

function DashboardEmpty() {
  return (
    <Card padding="lg">
      <EmptyState title={t.noActivity} description={t.noActivityHint} />
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="flex flex-col gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-20" />
          </Card>
        ))}
      </div>
      <Card>
        <div className="flex items-center justify-between gap-3 mb-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-9 w-44" />
        </div>
        <Skeleton className="h-28 w-full" />
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
      className="inline-flex rounded-lg border border-(--color-border) bg-(--color-surface-muted) p-0.5 text-xs"
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
