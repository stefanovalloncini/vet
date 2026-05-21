import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { AppShell, Card, CardSkeleton } from "../../../shared/ui";
import { useAttivita } from "../../attivita/hooks/useAttivita";
import { usePaymentsData } from "../../payments/hooks/usePaymentsData";
import { computeArrears } from "../../payments/lib/arrears";
import {
  endOfMonthLocal,
  percentDiff,
  startOfMonthLocal,
  statsForRange,
  topEntry,
  trailingMonths,
} from "../lib/stats";
import { dashboardI18n as t } from "../i18n";
import { formatEuro } from "../../attivita/lib/format";
import { RevenueBarChart } from "./RevenueBarChart";
import { BarChart } from "./BarChart";
import { useReminders } from "../../reminders/hooks/useReminders";
import { OnboardingBanner } from "../../onboarding/OnboardingBanner";

export function DashboardPage() {
  const now = useMemo(() => new Date(), []);
  const monthStart = useMemo(() => startOfMonthLocal(now), [now]);
  const monthEnd = useMemo(() => endOfMonthLocal(now), [now]);
  const lastMonthStart = useMemo(
    () => new Date(now.getFullYear(), now.getMonth() - 1, 1),
    [now]
  );
  const lastMonthEnd = useMemo(
    () => new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999),
    [now]
  );

  const trailingStart = useMemo(
    () => new Date(now.getFullYear() - 1, now.getMonth() + 1, 1),
    [now]
  );

  const allRangeFilters = useMemo(
    () => ({ from: trailingStart, to: monthEnd }),
    [trailingStart, monthEnd]
  );
  const { items, loading } = useAttivita(allRangeFilters);

  const trailing = useMemo(() => trailingMonths(items, now, 12), [items, now]);
  const { aziende, payments } = usePaymentsData();

  const thisMonth = useMemo(
    () => statsForRange(items, monthStart, monthEnd),
    [items, monthStart, monthEnd]
  );
  const lastMonth = useMemo(
    () => statsForRange(items, lastMonthStart, lastMonthEnd),
    [items, lastMonthStart, lastMonthEnd]
  );

  const totalDiff = percentDiff(thisMonth.total, lastMonth.total);
  const countDiff = percentDiff(thisMonth.count, lastMonth.count);
  const topA = topEntry(thisMonth.byAzienda);
  const topT = topEntry(thisMonth.byTipo);

  const arrears = useMemo(
    () => computeArrears(aziende, items, payments, now),
    [aziende, items, payments, now]
  );
  const arrearsTotal = arrears.reduce((s, a) => s + a.unpaidTotal, 0);
  const aziendeAttive = thisMonth.byAzienda.size;

  const { reminders: openReminders } = useReminders({ onlyOpen: true });
  const urgentReminders = useMemo(
    () =>
      openReminders
        .filter((r) => r.dueAt.getTime() <= now.getTime() + 7 * 86_400_000)
        .slice(0, 5),
    [openReminders, now]
  );

  const recentAziende = useMemo(() => {
    const seen = new Set<string>();
    const out: { id: string; nome: string }[] = [];
    for (const a of items) {
      if (seen.has(a.aziendaId)) continue;
      seen.add(a.aziendaId);
      out.push({ id: a.aziendaId, nome: a.aziendaNome });
      if (out.length >= 4) break;
    }
    return out;
  }, [items]);

  const hasContent = !loading && items.length > 0;
  const hasRightRail =
    urgentReminders.length > 0 || recentAziende.length > 0;

  const topTipoBars = useMemo(
    () =>
      [...thisMonth.byTipo.values()]
        .sort((a, b) => b.total - a.total)
        .slice(0, 8)
        .map((v) => ({ label: v.nome, value: v.total })),
    [thisMonth.byTipo]
  );

  const rightRail = hasContent && hasRightRail ? (
    <>
      {urgentReminders.length > 0 ? (
        <Card className="border-(--color-accent)/40">
          <div className="flex items-baseline justify-between mb-2">
            <p className="text-xs uppercase tracking-wider text-(--color-text-muted)">
              Promemoria urgenti
            </p>
            <Link
              to="/promemoria"
              className="inline-flex items-center gap-1 text-xs text-(--color-accent) hover:underline"
            >
              Tutti
              <ChevronRight size={12} strokeWidth={2} aria-hidden="true" />
            </Link>
          </div>
          <ul className="space-y-1.5">
            {urgentReminders.map((r) => {
              const overdue = r.dueAt.getTime() < now.getTime();
              return (
                <li key={r.id} className="flex items-baseline justify-between gap-3">
                  <span className="text-sm text-(--color-text) truncate">
                    {r.titolo}{" "}
                    <span className="text-(--color-text-muted)">
                      · {r.aziendaNome}
                    </span>
                  </span>
                  <span
                    className={[
                      "text-xs tabular-nums flex-shrink-0",
                      overdue ? "text-(--color-danger)" : "text-(--color-text-muted)",
                    ].join(" ")}
                  >
                    {r.dueAt.toLocaleDateString("it-IT")}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      ) : null}
      {recentAziende.length > 0 ? (
        <Card>
          <p className="text-xs uppercase tracking-wider text-(--color-text-muted) mb-3">
            Clienti recenti
          </p>
          <ul className="space-y-1.5">
            {recentAziende.map((a) => (
              <li key={a.id}>
                <Link
                  to={`/aziende/${a.id}`}
                  className="block text-sm text-(--color-text) hover:text-(--color-accent) truncate"
                >
                  {a.nome}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </>
  ) : null;

  return (
    <AppShell wide {...(rightRail ? { rightRail } : {})}>
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl text-(--color-text)">{t.title}</h1>
        <p className="text-(--color-text-muted) mt-1 text-sm">{t.subtitle}</p>
      </header>

      <OnboardingBanner
        hasAziende={aziende.length > 0}
        hasAttivita={items.length > 0}
      />

      {loading ? (
        <CardSkeleton rows={4} />
      ) : items.length === 0 ? (
        <p className="text-sm text-(--color-text-muted) py-2">
          {t.noActivity}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 auto-rows-fr">
            <MetricCard
              label={t.incassoMese}
              value={formatEuro(thisMonth.total)}
              trend={totalDiff}
            />
            <MetricCard
              label={t.visiteMese}
              value={String(thisMonth.count)}
              trend={countDiff}
            />
            <MetricCard
              label={t.aziendeAttive}
              value={String(aziendeAttive)}
            />
            <Link to="/pagamenti" className="block">
              <MetricCard
                label={t.arretratiTot}
                value={formatEuro(arrearsTotal)}
                accent={arrearsTotal > 0 ? "danger" : "ok"}
              />
            </Link>
            {topA ? (
              <MetricCard
                label={t.topAzienda}
                value={topA.value.nome}
                secondary={`${formatEuro(topA.value.total)} · ${topA.value.count} visite`}
                compactValue
              />
            ) : null}
            {topT ? (
              <MetricCard
                label={t.topTipo}
                value={topT.value.nome}
                secondary={`${formatEuro(topT.value.total)} · ${topT.value.count} volte`}
                compactValue
              />
            ) : null}
          </div>
          <Card className="mb-4">
            <p className="text-xs uppercase tracking-wider text-(--color-text-muted)">
              Incassi ultimi 12 mesi
            </p>
            <RevenueBarChart
              values={trailing.totals}
              labels={trailing.labels}
              className="mt-3"
            />
          </Card>
          {thisMonth.byTipo.size > 0 ? (
            <Card>
              <p className="text-xs uppercase tracking-wider text-(--color-text-muted) mb-3">
                Attività del mese per tipo
              </p>
              <BarChart bars={topTipoBars} formatValue={formatEuro} />
            </Card>
          ) : null}
        </>
      )}
    </AppShell>
  );
}

function MetricCard({
  label,
  value,
  trend,
  secondary,
  accent,
  compactValue,
}: {
  label: string;
  value: string;
  trend?: number | null;
  secondary?: string;
  accent?: "danger" | "ok";
  compactValue?: boolean;
}) {
  const valueColor =
    accent === "danger" ? "text-(--color-danger)" : "text-(--color-text)";
  const trendLine =
    trend !== null && trend !== undefined
      ? {
          text: `${trend > 0 ? "↑" : trend < 0 ? "↓" : "→"} ${Math.abs(trend)}% vs mese prec.`,
          color:
            trend > 0
              ? "text-(--color-success)"
              : trend < 0
              ? "text-(--color-danger)"
              : "text-(--color-text-subtle)",
        }
      : null;
  const secondaryLine = secondary
    ? { text: secondary, color: "text-(--color-text-muted)" }
    : trendLine;

  return (
    <Card
      className={[
        "h-full flex flex-col min-h-[112px]",
        accent === "danger" ? "border-(--color-danger)/30" : "",
      ].join(" ")}
    >
      <p className="text-[10px] uppercase tracking-[0.06em] text-(--color-text-muted) truncate">
        {label}
      </p>
      <div className="mt-auto pt-3">
        <p
          className={[
            "tabular-nums font-medium truncate",
            compactValue ? "text-base sm:text-lg" : "text-xl sm:text-2xl",
            valueColor,
          ].join(" ")}
        >
          {value}
        </p>
        <p
          className={[
            "text-[11px] mt-0.5 tabular-nums truncate min-h-[14px]",
            secondaryLine ? secondaryLine.color : "text-(--color-text-subtle)",
          ].join(" ")}
        >
          {secondaryLine ? secondaryLine.text : " "}
        </p>
      </div>
    </Card>
  );
}
