import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AppShell, Card, CardSkeleton } from "../../../shared/ui";
import { dashboardI18n as t } from "../i18n";
import { formatEuro } from "../../attivita/lib/format";
import { RevenueBarChart } from "./RevenueBarChart";
import { BarChart } from "./BarChart";
import { OnboardingBanner } from "../../onboarding/OnboardingBanner";
import { useDashboardStats, type DashboardStats } from "../hooks/useDashboardStats";
import { MetricCard } from "./MetricCard";
import { DashboardRightRail } from "./DashboardRightRail";

export function DashboardPage() {
  const now = useMemo(() => new Date(), []);
  const stats = useDashboardStats(now);
  const hasContent = !stats.loading && stats.items.length > 0;
  const hasRightRail =
    stats.urgentReminders.length > 0 || stats.recentAziende.length > 0;

  const rightRail =
    hasContent && hasRightRail ? (
      <DashboardRightRail
        urgentReminders={stats.urgentReminders}
        recentAziende={stats.recentAziende}
        now={now}
      />
    ) : null;

  return (
    <AppShell wide {...(rightRail ? { rightRail } : {})}>
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl text-(--color-text)">{t.title}</h1>
        <p className="text-(--color-text-muted) mt-1 text-sm">{t.subtitle}</p>
      </header>

      <OnboardingBanner
        hasAziende={stats.aziende.length > 0}
        hasAttivita={stats.items.length > 0}
      />

      {stats.loading ? (
        <CardSkeleton rows={4} />
      ) : stats.items.length === 0 ? (
        <p className="text-sm text-(--color-text-muted) py-2">{t.noActivity}</p>
      ) : (
        <DashboardBody stats={stats} />
      )}
    </AppShell>
  );
}

function DashboardBody({ stats }: { stats: DashboardStats }) {
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 auto-rows-fr">
        <MetricCard
          label={t.incassoMese}
          value={formatEuro(stats.thisMonth.total)}
          trend={stats.totalDiff}
        />
        <MetricCard
          label={t.visiteMese}
          value={String(stats.thisMonth.count)}
          trend={stats.countDiff}
        />
        <MetricCard label={t.aziendeAttive} value={String(stats.aziendeAttiveCount)} />
        <Link to="/pagamenti" className="block">
          <MetricCard
            label={t.arretratiTot}
            value={formatEuro(stats.arrearsTotal)}
            accent={stats.arrearsTotal > 0 ? "danger" : "ok"}
          />
        </Link>
        {stats.topAzienda ? (
          <MetricCard
            label={t.topAzienda}
            value={stats.topAzienda.value.nome}
            secondary={`${formatEuro(stats.topAzienda.value.total)} · ${stats.topAzienda.value.count} visite`}
            compactValue
          />
        ) : null}
        {stats.topTipo ? (
          <MetricCard
            label={t.topTipo}
            value={stats.topTipo.value.nome}
            secondary={`${formatEuro(stats.topTipo.value.total)} · ${stats.topTipo.value.count} volte`}
            compactValue
          />
        ) : null}
      </div>
      <Card className="mb-4">
        <p className="text-xs uppercase tracking-wider text-(--color-text-muted)">
          Incassi ultimi 12 mesi
        </p>
        <RevenueBarChart
          values={stats.trailing.totals}
          labels={stats.trailing.labels}
          className="mt-3"
        />
      </Card>
      {stats.thisMonth.byTipo.size > 0 ? (
        <Card>
          <p className="text-xs uppercase tracking-wider text-(--color-text-muted) mb-3">
            Attività del mese per tipo
          </p>
          <BarChart bars={stats.topTipoBars} formatValue={formatEuro} />
        </Card>
      ) : null}
    </>
  );
}
