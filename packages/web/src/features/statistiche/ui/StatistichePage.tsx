import { useMemo, useState } from "react";
import { AppShell, Card, Select } from "../../../shared/ui";
import { useAttivita } from "../../attivita/hooks/useAttivita";
import { BarChart } from "../../dashboard/ui/BarChart";
import { Heatmap } from "./Heatmap";
import { DonutChart } from "./DonutChart";
import { Sparkline } from "../../dashboard/ui/Sparkline";
import { formatEuro } from "../../attivita/lib/format";
import type { Attivita } from "@vet/shared";

type Range = "12m" | "ytd" | "all";

export function StatistichePage() {
  const now = useMemo(() => new Date(), []);
  const [range, setRange] = useState<Range>("12m");

  const filters = useMemo(() => {
    if (range === "ytd") {
      return { from: new Date(now.getFullYear(), 0, 1), to: now };
    }
    if (range === "12m") {
      return {
        from: new Date(now.getFullYear() - 1, now.getMonth() + 1, 1),
        to: now,
      };
    }
    return {};
  }, [range, now]);

  const { items, loading } = useAttivita(filters);
  const { items: lastYearItems } = useAttivita(
    useMemo(
      () => ({
        from: new Date(now.getFullYear() - 1, 0, 1),
        to: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999),
      }),
      [now]
    )
  );

  const byTipo = useMemo(() => {
    const map = new Map<string, { label: string; value: number }>();
    for (const a of items) {
      const cur = map.get(a.tipoId) ?? { label: a.tipoNome, value: 0 };
      cur.value += a.totale;
      map.set(a.tipoId, cur);
    }
    return [...map.values()].sort((a, b) => b.value - a.value).slice(0, 8);
  }, [items]);

  const topClients = useMemo(() => {
    const map = new Map<string, { label: string; value: number; count: number }>();
    for (const a of items) {
      const cur = map.get(a.aziendaId) ?? {
        label: a.aziendaNome,
        value: 0,
        count: 0,
      };
      cur.value += a.totale;
      cur.count += 1;
      map.set(a.aziendaId, cur);
    }
    return [...map.values()]
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [items]);

  const monthlyComparison = useMemo(() => {
    const thisYear: number[] = new Array(12).fill(0);
    const lastYear: number[] = new Array(12).fill(0);
    for (const a of items) {
      if (a.data.getFullYear() === now.getFullYear()) {
        thisYear[a.data.getMonth()] = (thisYear[a.data.getMonth()] ?? 0) + a.totale;
      }
    }
    for (const a of lastYearItems) {
      lastYear[a.data.getMonth()] = (lastYear[a.data.getMonth()] ?? 0) + a.totale;
    }
    return { thisYear, lastYear };
  }, [items, lastYearItems, now]);

  const totalRange = useMemo(
    () => items.reduce((s, a) => s + a.totale, 0),
    [items]
  );
  const totalLastYear = useMemo(
    () => lastYearItems.reduce((s, a) => s + a.totale, 0),
    [lastYearItems]
  );
  const yoyDiff =
    totalLastYear > 0
      ? Math.round(((totalRange - totalLastYear) / totalLastYear) * 100)
      : null;

  return (
    <AppShell>
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl text-(--color-text)">Statistiche</h1>
          <p className="text-(--color-text-muted) mt-2 text-sm">
            Numeri, tendenze, distribuzioni.
          </p>
        </div>
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
            onChange={(e) => setRange(e.target.value as Range)}
          />
        </div>
      </header>

      {loading ? (
        <p className="text-sm text-(--color-text-muted)">Caricamento…</p>
      ) : items.length === 0 ? (
        <Card>
          <p className="text-sm text-(--color-text-muted) text-center py-4">
            Nessun dato per il periodo.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <p className="text-xs uppercase tracking-wider text-(--color-text-muted)">
              Mappa attività · 13 settimane
            </p>
            <div className="mt-4">
              <Heatmap items={items} weeks={13} now={now} />
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <p className="text-xs uppercase tracking-wider text-(--color-text-muted) mb-3">
                Distribuzione per tipo
              </p>
              <DonutChart slices={byTipo} formatValue={formatEuro} />
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-wider text-(--color-text-muted) mb-3">
                Top 5 clienti
              </p>
              <BarChart
                bars={topClients.map((c) => ({
                  label: `${c.label} (${c.count})`,
                  value: c.value,
                }))}
                formatValue={formatEuro}
              />
            </Card>
          </div>

          <Card>
            <div className="flex items-baseline justify-between mb-3">
              <p className="text-xs uppercase tracking-wider text-(--color-text-muted)">
                Confronto mese su mese
              </p>
              {yoyDiff !== null ? (
                <span
                  className={[
                    "text-xs tabular-nums",
                    yoyDiff > 0
                      ? "text-(--color-success)"
                      : yoyDiff < 0
                      ? "text-(--color-danger)"
                      : "text-(--color-text-subtle)",
                  ].join(" ")}
                >
                  {yoyDiff > 0 ? "↑" : yoyDiff < 0 ? "↓" : "→"}{" "}
                  {Math.abs(yoyDiff)}% vs anno scorso
                </span>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-(--color-text-subtle) mb-1">
                  {now.getFullYear()}
                </p>
                <Sparkline values={monthlyComparison.thisYear} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-(--color-text-subtle) mb-1">
                  {now.getFullYear() - 1}
                </p>
                <Sparkline values={monthlyComparison.lastYear} />
              </div>
            </div>
          </Card>
        </div>
      )}
    </AppShell>
  );
}

void Attivita;
