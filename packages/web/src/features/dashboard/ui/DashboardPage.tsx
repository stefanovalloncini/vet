import { useMemo } from "react";
import { AppShell, Card, EmptyState, InlineError, Skeleton } from "../../../shared/ui";
import { dashboardI18n as t } from "../i18n";
import { Onboarding } from "../../onboarding";
import { OnboardingBanner } from "../../onboarding/OnboardingBanner";
import { useDashboardStats, type DashboardStats } from "../hooks/useDashboardStats";
import { MONTHS_IT } from "../../../shared/i18n/months";
import { MetricBar } from "./MetricBar";
import { ChartPanel } from "./ChartPanel";

function periodLabel(now: Date): string {
  const m = MONTHS_IT[now.getMonth()] ?? "";
  return `${m.charAt(0).toUpperCase() + m.slice(1)} ${now.getFullYear()}`;
}

export function DashboardPage() {
  const now = useMemo(() => new Date(), []);
  const stats = useDashboardStats(now);

  return (
    <AppShell wide>
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

function DashboardBody({ stats }: { stats: DashboardStats }) {
  const metrics = [
    { label: t.visiteMese, value: String(stats.thisMonth.count) },
    { label: t.aziendeAttive, value: String(stats.aziendeAttiveCount) },
  ];
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <MetricBar metrics={metrics} />
      <ChartPanel trailing={stats.trailing} className="min-w-0" />
    </div>
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
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="grid grid-cols-2 gap-px rounded-lg border border-(--color-border) overflow-hidden">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 bg-(--color-surface) px-4 py-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
      <Card>
        <div className="flex items-center justify-between gap-3 mb-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-9 w-44" />
        </div>
        <Skeleton className="h-28 w-full" />
      </Card>
    </div>
  );
}
