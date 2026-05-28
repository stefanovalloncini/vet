import { useMemo, useState } from "react";
import {
  AppShell,
  Card,
  EmptyState,
  LoadingHint,
  PageHeader,
  SectionLabel,
  Select,
} from "../../../shared/ui";
import { BarChart } from "../../../shared/ui/charts/BarChart";
import { ChartEmpty } from "./ChartEmpty";
import { Heatmap } from "./Heatmap";
import { DonutChart } from "./DonutChart";
import { StackedBarChart } from "./StackedBarChart";
import { Funnel } from "./Funnel";
import { WeekdayChart } from "./WeekdayChart";
import { ZonePanel } from "./ZonePanel";
import { Sparkline } from "../../../shared/ui/charts/Sparkline";
import { formatEuro } from "../../../shared/lib/format";
import {
  useStatistiche,
  type StatistichePeriodo,
  type StatisticheData,
} from "../hooks/useStatistiche";

export function StatistichePage() {
  const now = useMemo(() => new Date(), []);
  const [range, setRange] = useState<StatistichePeriodo>("12m");
  const data = useStatistiche(range, now);

  return (
    <AppShell>
      <Header range={range} onRangeChange={setRange} />

      {data.loading ? (
        <LoadingHint />
      ) : data.items.length === 0 ? (
        <EmptyState
          title="Nessun dato per il periodo."
          description="Cambia intervallo o registra qualche attività."
        />
      ) : (
        <StatistichePanels data={data} now={now} />
      )}
    </AppShell>
  );
}

interface HeaderProps {
  range: StatistichePeriodo;
  onRangeChange: (next: StatistichePeriodo) => void;
}

function Header({ range, onRangeChange }: HeaderProps) {
  return (
    <PageHeader
      title="Statistiche"
      subtitle="Numeri, tendenze, distribuzioni."
      actions={
        <div className="max-w-xs">
          <Select
            id="range"
            label="Periodo"
            value={range}
            options={[
              { value: "12m", label: "Ultimi 12 mesi" },
              { value: "ytd", label: "Anno corrente" },
              { value: "all", label: "Sempre" },
            ]}
            onChange={(e) => onRangeChange(e.target.value as StatistichePeriodo)}
          />
        </div>
      }
    />
  );
}

interface StatistichePanelsProps {
  data: StatisticheData;
  now: Date;
}

function StatistichePanels({ data, now }: StatistichePanelsProps) {
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
  children: React.ReactNode;
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
    <Card>
      <dl
        className="grid grid-cols-3 gap-4 sm:gap-8"
        aria-live="polite"
      >
        <SummaryCell label="Visite" value={String(visite)} />
        <SummaryCell label="Ricavi" value={formatEuro(ricavi)} />
        <SummaryCell label="Aziende attive" value={String(aziendeAttive)} />
      </dl>
    </Card>
  );
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] uppercase tracking-wider font-medium text-(--color-text-muted)">
        {label}
      </dt>
      <dd className="mt-1 text-xl sm:text-2xl font-medium text-(--color-text) tabular-nums truncate">
        {value}
      </dd>
    </div>
  );
}

function countAziendeAttive(data: StatisticheData): number {
  const ids = new Set<string>();
  for (const a of data.items) ids.add(a.aziendaId);
  return ids.size;
}
