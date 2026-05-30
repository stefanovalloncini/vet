import { useMemo, useState } from "react";
import {
  AppShell,
  EmptyState,
  LoadingHint,
  PageHeader,
  Select,
} from "../../../shared/ui";
import {
  useStatistiche,
  type StatistichePeriodo,
} from "../hooks/useStatistiche";
import { StatistichePanels } from "./StatistichePanels";

export function StatistichePage() {
  const now = useMemo(() => new Date(), []);
  const [range, setRange] = useState<StatistichePeriodo>("12m");
  const data = useStatistiche(range, now);

  return (
    <AppShell wide>
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
