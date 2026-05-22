import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  ClipboardList,
  Building2,
  Wallet,
  Crown,
  Tag,
} from "lucide-react";
import { AppShell, Card, CardSkeleton, InlineError, SectionLabel } from "../../../shared/ui";
import { dashboardI18n as t } from "../i18n";
import { formatEuro } from "../../attivita/lib/format";
import { RevenueBarChart } from "./RevenueBarChart";
import { BarChart } from "./BarChart";
import { OnboardingBanner } from "../../onboarding/OnboardingBanner";
import { useDashboardStats, type DashboardStats } from "../hooks/useDashboardStats";
import { MetricCard } from "./MetricCard";
import { DashboardRightRail } from "./DashboardRightRail";

const MONTHS_IT = [
  "gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
  "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre",
];

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
        <CardSkeleton rows={4} />
      ) : stats.isError ? (
        <InlineError>{t.loadError}</InlineError>
      ) : stats.items.length === 0 ? (
        <p className="text-sm text-(--color-text-muted) py-2">{t.noActivity}</p>
      ) : (
        <DashboardBody stats={stats} now={now} />
      )}
    </AppShell>
  );
}

function DashboardBody({ stats, now }: { stats: DashboardStats; now: Date }) {
  const hasFooter =
    stats.urgentReminders.length > 0 || stats.recentAziende.length > 0;
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 auto-rows-fr">
        <MetricCard
          label={t.incassoMese}
          value={formatEuro(stats.thisMonth.total)}
          trend={stats.totalDiff}
          icon={TrendingUp}
        />
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
        <Link to="/pagamenti" className="block">
          <MetricCard
            label={t.arretratiTot}
            value={formatEuro(stats.arrearsTotal)}
            accent={stats.arrearsTotal > 0 ? "danger" : "ok"}
            icon={Wallet}
          />
        </Link>
        {stats.topAzienda ? (
          <Link to={`/aziende/${stats.topAzienda.key}`} className="block">
            <MetricCard
              label={t.topAzienda}
              value={stats.topAzienda.value.nome}
              secondary={`${formatEuro(stats.topAzienda.value.total)} · ${stats.topAzienda.value.count} visite`}
              compactValue
              icon={Crown}
            />
          </Link>
        ) : null}
        {stats.topTipo ? (
          <MetricCard
            label={t.topTipo}
            value={stats.topTipo.value.nome}
            secondary={`${formatEuro(stats.topTipo.value.total)} · ${stats.topTipo.value.count} volte`}
            compactValue
            icon={Tag}
          />
        ) : null}
      </div>
      <Card className="mb-4">
        <SectionLabel>Incassi ultimi 12 mesi</SectionLabel>
        <RevenueBarChart
          values={stats.trailing.totals}
          labels={stats.trailing.labels}
          className="mt-3"
        />
      </Card>
      {stats.thisMonth.byTipo.size > 0 ? (
        <Card>
          <SectionLabel className="mb-3">Attività del mese per tipo</SectionLabel>
          <BarChart bars={stats.topTipoBars} formatValue={formatEuro} />
        </Card>
      ) : null}
      {hasFooter ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          <DashboardRightRail
            urgentReminders={stats.urgentReminders}
            recentAziende={stats.recentAziende}
            now={now}
          />
        </div>
      ) : null}
    </>
  );
}
