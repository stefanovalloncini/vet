import type { ReactNode } from "react";
import { Card, SectionLabel } from "../../../shared/ui";
import { BarChart } from "../../../shared/ui/charts/BarChart";
import { Sparkline } from "../../../shared/ui/charts/Sparkline";
import { formatEuro } from "../../../shared/lib/format";
import { ChartEmpty } from "./ChartEmpty";
import { Heatmap } from "./Heatmap";
import { DonutChart } from "./DonutChart";
import { StackedBarChart } from "./StackedBarChart";
import { Funnel } from "./Funnel";
import { WeekdayChart } from "./WeekdayChart";
import { ZonePanel } from "./ZonePanel";
import type { StatisticheData } from "../hooks/useStatistiche";

interface StatistichePanelsProps {
  data: StatisticheData;
  now: Date;
}

export function StatistichePanels({ data, now }: StatistichePanelsProps) {
  return (
    <div className="space-y-4">
      <SummaryStrip
        visite={data.items.length}
        ricavi={data.totalRange}
        aziendeAttive={countAziendeAttive(data)}
      />

      <Panel title="Mappa attività · 13 settimane">
        <Heatmap items={data.items} weeks={13} now={now} />
      </Panel>

      <Panel title="Ricavi mese per mese, per tipo">
        <StackedBarChart bars={data.stackedMonths} formatValue={formatEuro} />
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Distribuzione per tipo">
          <DonutChart slices={data.byTipo} formatValue={formatEuro} />
        </Panel>
        <Panel title="Top 5 clienti">
          {data.topClients.length === 0 ? (
            <ChartEmpty />
          ) : (
            <BarChart
              bars={data.topClients.map((c) => ({
                label: `${c.label} (${c.count})`,
                value: c.value,
              }))}
              formatValue={formatEuro}
            />
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Visite per giorno della settimana">
          <WeekdayChart items={data.items} />
        </Panel>
        <Panel title="Funnel fatturazione">
          <Funnel stages={data.funnel} />
        </Panel>
      </div>

      <Card>
        <div className="flex items-baseline justify-between mb-3">
          <SectionLabel>Confronto mese su mese</SectionLabel>
          {data.yoyDiff !== null ? <YoyBadge value={data.yoyDiff} /> : null}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <SparklineColumn
            year={now.getFullYear()}
            values={data.monthlyComparison.thisYear}
          />
          <SparklineColumn
            year={now.getFullYear() - 1}
            values={data.monthlyComparison.lastYear}
          />
        </div>
      </Card>

      <Panel title="Allevamenti per zona">
        <ZonePanel aziende={data.aziende} />
      </Panel>
    </div>
  );
}

interface PanelProps {
  title: string;
  children: ReactNode;
}

function Panel({ title, children }: PanelProps) {
  return (
    <Card>
      <SectionLabel className="mb-3">{title}</SectionLabel>
      {children}
    </Card>
  );
}

function YoyBadge({ value }: { value: number }) {
  const cls = [
    "text-xs tabular-nums",
    value > 0
      ? "text-(--color-success)"
      : value < 0
        ? "text-(--color-danger)"
        : "text-(--color-text-subtle)",
  ].join(" ");
  const arrow = value > 0 ? "↑" : value < 0 ? "↓" : "→";
  return (
    <span className={cls}>
      <span aria-hidden="true">{arrow}</span> {Math.abs(value)}% rispetto all&apos;anno
      scorso
    </span>
  );
}

function SparklineColumn({ year, values }: { year: number; values: number[] }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-(--color-text-subtle) mb-1">
        {year}
      </p>
      <Sparkline values={values} />
    </div>
  );
}

interface SummaryStripProps {
  visite: number;
  ricavi: number;
  aziendeAttive: number;
}

function SummaryStrip({ visite, ricavi, aziendeAttive }: SummaryStripProps) {
  return (
    <dl
      className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-(--color-border) bg-(--color-surface) px-4 py-2.5 text-sm"
      aria-live="polite"
    >
      <SummaryCell label="Visite" value={String(visite)} />
      <SummaryCell label="Ricavi" value={formatEuro(ricavi)} />
      <SummaryCell label="Aziende attive" value={String(aziendeAttive)} />
    </dl>
  );
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5 min-w-0">
      <dt className="text-(--color-text-muted)">{label}</dt>
      <dd className="tabular-nums text-(--color-text)">{value}</dd>
    </div>
  );
}

function countAziendeAttive(data: StatisticheData): number {
  const ids = new Set<string>();
  for (const a of data.items) ids.add(a.aziendaId);
  return ids.size;
}
