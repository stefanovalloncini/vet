import { useMemo, useState } from "react";
import {
  AppShell,
  Card,
  InlineError,
  LoadingHint,
  PageHeader,
  SectionLabel,
  Select,
} from "../../../shared/ui";
import { useVetStats } from "../hooks/useVetStats";
import { formatEuro } from "../../../shared/lib/format";
import { BarChart } from "../../dashboard/ui/BarChart";

type Range = "month" | "year" | "all";

export function VetStatsPage() {
  const [range, setRange] = useState<Range>("month");
  const now = useMemo(() => new Date(), []);
  const filters = useMemo(() => {
    if (range === "month") {
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
      };
    }
    if (range === "year") {
      return {
        from: new Date(now.getFullYear(), 0, 1),
        to: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999),
      };
    }
    return {};
  }, [range, now]);

  const { data, isLoading, isError } = useVetStats(filters);
  const stats = data ?? [];

  const totalAll = stats.reduce((s, v) => s + v.total, 0);

  return (
    <AppShell>
      <PageHeader
        title="Statistiche veterinari"
        subtitle="Incassi e visite raggruppati per veterinario."
      />

      <Card className="mb-6 max-w-xs">
        <Select
          id="range"
          label="Periodo"
          value={range}
          options={[
            { value: "month", label: "Questo mese" },
            { value: "year", label: "Questo anno" },
            { value: "all", label: "Sempre" },
          ]}
          onChange={(e) => setRange(e.target.value as Range)}
        />
      </Card>

      {isLoading ? (
        <LoadingHint />
      ) : isError ? (
        <InlineError>Caricamento fallito.</InlineError>
      ) : stats.length === 0 ? (
        <Card>
          <p className="text-sm text-(--color-text-muted) text-center py-4">
            Nessun dato per il periodo.
          </p>
        </Card>
      ) : (
        <>
          <Card className="mb-6">
            <SectionLabel className="mb-3">Distribuzione incassi</SectionLabel>
            <BarChart
              bars={stats.map((s) => ({ label: s.nome, value: s.total }))}
              formatValue={formatEuro}
            />
          </Card>

          <ul className="space-y-2">
            {stats.map((s) => {
              const pct = totalAll > 0 ? Math.round((s.total / totalAll) * 100) : 0;
              return (
                <li key={s.uid}>
                  <Card>
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-base font-medium text-(--color-text)">
                          {s.nome}
                        </p>
                        <p className="text-xs text-(--color-text-muted) mt-1 truncate">
                          {s.email} · {s.count} visite
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-lg font-medium text-(--color-text) tabular-nums">
                          {formatEuro(s.total)}
                        </span>
                        <p className="text-xs text-(--color-text-subtle) mt-0.5 tabular-nums">
                          {pct}%
                        </p>
                      </div>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </AppShell>
  );
}
