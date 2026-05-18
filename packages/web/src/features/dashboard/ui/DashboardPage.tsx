import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AppShell, Card } from "../../../shared/ui";
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
import { Sparkline } from "./Sparkline";

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

  return (
    <AppShell>
      <header className="mb-8">
        <h1 className="text-3xl text-(--color-text)">{t.title}</h1>
        <p className="text-(--color-text-muted) mt-2 text-sm">{t.subtitle}</p>
      </header>

      {loading ? (
        <p className="text-sm text-(--color-text-muted)">{t.loading}</p>
      ) : items.length === 0 ? (
        <Card>
          <p className="text-sm text-(--color-text-muted) text-center py-4">
            {t.noActivity}
          </p>
        </Card>
      ) : (
        <>
        <Card className="mb-4">
          <p className="text-xs uppercase tracking-wider text-(--color-text-muted)">
            Incassi ultimi 12 mesi
          </p>
          <Sparkline
            values={trailing.totals}
            labels={trailing.labels}
            className="mt-3"
          />
        </Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label={t.incassoMese}
            value={formatEuro(thisMonth.total)}
            diff={totalDiff}
            big
          />
          <StatCard
            label={t.visiteMese}
            value={String(thisMonth.count)}
            diff={countDiff}
          />
          <StatCard
            label={t.aziendeAttive}
            value={String(aziendeAttive)}
          />
          <Link to="/pagamenti" className="block">
            <StatCard
              label={t.arretratiTot}
              value={formatEuro(arrearsTotal)}
              accent={arrearsTotal > 0 ? "danger" : "ok"}
            />
          </Link>
          {topA ? (
            <Card>
              <p className="text-xs uppercase tracking-wider text-(--color-text-muted)">
                {t.topAzienda}
              </p>
              <p className="text-lg font-medium text-(--color-text) mt-2">
                {topA.value.nome}
              </p>
              <p className="text-sm text-(--color-text-muted) mt-1 tabular-nums">
                {formatEuro(topA.value.total)} · {topA.value.count} visite
              </p>
            </Card>
          ) : null}
          {topT ? (
            <Card>
              <p className="text-xs uppercase tracking-wider text-(--color-text-muted)">
                {t.topTipo}
              </p>
              <p className="text-lg font-medium text-(--color-text) mt-2">
                {topT.value.nome}
              </p>
              <p className="text-sm text-(--color-text-muted) mt-1 tabular-nums">
                {formatEuro(topT.value.total)} · {topT.value.count} volte
              </p>
            </Card>
          ) : null}
        </div>
        </>
      )}
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  diff,
  big,
  accent,
}: {
  label: string;
  value: string;
  diff?: number | null;
  big?: boolean;
  accent?: "danger" | "ok";
}) {
  return (
    <Card
      className={
        accent === "danger" ? "border-(--color-danger)/30" : undefined
      }
    >
      <p className="text-xs uppercase tracking-wider text-(--color-text-muted)">
        {label}
      </p>
      <p
        className={[
          "mt-2 tabular-nums font-medium",
          big ? "text-3xl" : "text-2xl",
          accent === "danger" ? "text-(--color-danger)" : "text-(--color-text)",
        ].join(" ")}
      >
        {value}
      </p>
      {diff !== null && diff !== undefined ? (
        <p
          className={[
            "text-xs mt-1 tabular-nums",
            diff > 0
              ? "text-(--color-success)"
              : diff < 0
              ? "text-(--color-danger)"
              : "text-(--color-text-subtle)",
          ].join(" ")}
        >
          {diff > 0 ? "↑" : diff < 0 ? "↓" : "→"} {Math.abs(diff)}% vs mese scorso
        </p>
      ) : null}
    </Card>
  );
}
