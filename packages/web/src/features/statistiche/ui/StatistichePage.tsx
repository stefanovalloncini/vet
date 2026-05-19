import { useMemo, useState } from "react";
import { AppShell, Card, Select } from "../../../shared/ui";
import { useAttivita } from "../../attivita/hooks/useAttivita";
import { usePaymentsData } from "../../payments/hooks/usePaymentsData";
import { BarChart } from "../../dashboard/ui/BarChart";
import { Heatmap } from "./Heatmap";
import { DonutChart } from "./DonutChart";
import { StackedBarChart } from "./StackedBarChart";
import { Funnel } from "./Funnel";
import { WeekdayChart } from "./WeekdayChart";
import { ZonePanel } from "./ZonePanel";
import { Sparkline } from "../../dashboard/ui/Sparkline";
import { formatEuro } from "../../attivita/lib/format";

type Range = "12m" | "ytd" | "all";

const SHORT_MONTHS = [
  "Gen", "Feb", "Mar", "Apr", "Mag", "Giu",
  "Lug", "Ago", "Set", "Ott", "Nov", "Dic",
];

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
  const { aziende, payments } = usePaymentsData();

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
    return [...map.values()].sort((a, b) => b.value - a.value).slice(0, 5);
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

  const stackedMonths = useMemo(() => {
    const months: Array<{ label: string; segments: Map<string, { label: string; value: number }>; total: number }> = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: SHORT_MONTHS[d.getMonth()]!,
        segments: new Map(),
        total: 0,
      });
    }
    const cutoffStart = months[0]
      ? new Date(now.getFullYear(), now.getMonth() - 11, 1)
      : new Date(now);
    for (const a of items) {
      if (a.data < cutoffStart) continue;
      const idx = (a.data.getFullYear() - cutoffStart.getFullYear()) * 12 +
        (a.data.getMonth() - cutoffStart.getMonth());
      const bucket = months[idx];
      if (!bucket) continue;
      const cur = bucket.segments.get(a.tipoId) ?? { label: a.tipoNome, value: 0 };
      cur.value += a.totale;
      bucket.segments.set(a.tipoId, cur);
      bucket.total += a.totale;
    }
    return months.map((m) => ({
      label: m.label,
      total: m.total,
      segments: [...m.segments.entries()].map(([key, v]) => ({
        key,
        label: v.label,
        value: v.value,
      })),
    }));
  }, [items, now]);

  const funnel = useMemo(() => {
    const all = items.length;
    const paidByAzienda = new Map<string, number>();
    for (const p of payments) {
      const cur = paidByAzienda.get(p.aziendaId);
      const t = p.periodoFinoA.getTime();
      if (cur === undefined || t > cur) paidByAzienda.set(p.aziendaId, t);
    }
    let paidCount = 0;
    let invoicedCount = 0;
    const now12 = items[0]?.data ?? new Date();
    void now12;
    for (const a of items) {
      const paidUpTo = paidByAzienda.get(a.aziendaId);
      if (paidUpTo !== undefined && a.data.getTime() <= paidUpTo) paidCount++;
      const az = aziende.find((x) => x.id === a.aziendaId);
      if (az?.cadenzaFatturazione) invoicedCount++;
    }
    return [
      {
        label: "Visite registrate",
        value: all,
      },
      {
        label: "In aziende con cadenza fatturazione",
        value: invoicedCount,
        hint: "Aziende con cadenza monthly/quarterly/semiannual impostata",
      },
      {
        label: "Già coperte da un pagamento",
        value: paidCount,
        hint: "Visite con data ≤ ultimo periodoFinoA dell'azienda",
      },
    ];
  }, [items, payments, aziende]);

  const totalRange = useMemo(() => items.reduce((s, a) => s + a.totale, 0), [items]);
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

          <Card>
            <p className="text-xs uppercase tracking-wider text-(--color-text-muted) mb-4">
              Ricavi mese per mese, per tipo
            </p>
            <StackedBarChart
              bars={stackedMonths}
              formatValue={formatEuro}
            />
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <p className="text-xs uppercase tracking-wider text-(--color-text-muted) mb-3">
                Visite per giorno della settimana
              </p>
              <WeekdayChart items={items} />
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-wider text-(--color-text-muted) mb-3">
                Funnel fatturazione
              </p>
              <Funnel stages={funnel} />
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

          <Card>
            <p className="text-xs uppercase tracking-wider text-(--color-text-muted) mb-3">
              Allevamenti per zona
            </p>
            <ZonePanel aziende={aziende} />
          </Card>
        </div>
      )}
    </AppShell>
  );
}
