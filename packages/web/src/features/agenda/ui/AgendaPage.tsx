import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell, Button, Card } from "../../../shared/ui";
import { useAttivita } from "../../attivita/hooks/useAttivita";
import { useAuthState } from "../../auth";
import { agendaI18n as t, MONTHS, WEEKDAYS } from "../i18n";
import {
  addMonths,
  buildMonthGrid,
  endOfMonth,
  sameDay,
  startOfMonth,
} from "../lib/calendar";
import { formatEuro } from "../../attivita/lib/format";
import type { Attivita } from "@vet/shared";

export function AgendaPage() {
  const { user } = useAuthState();
  const [view, setView] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState<Date>(new Date());

  const filters = useMemo(
    () => ({ from: startOfMonth(view), to: endOfMonth(view) }),
    [view]
  );
  const { items, loading } = useAttivita(filters);

  const days = useMemo(() => buildMonthGrid(view), [view]);

  const byDay = useMemo(() => {
    const m = new Map<string, Attivita[]>();
    for (const a of items) {
      const k = dayKey(a.data);
      const arr = m.get(k) ?? [];
      arr.push(a);
      m.set(k, arr);
    }
    return m;
  }, [items]);

  const todaysItems = byDay.get(dayKey(selected)) ?? [];

  const canCreate = user?.caps.has("activities.create") ?? false;

  return (
    <AppShell>
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl text-(--color-text)">{t.title}</h1>
          <p className="text-(--color-text-muted) mt-2 text-sm">
            {t.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setView((v) => addMonths(v, -1))}
          >
            {t.meseScorso}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              const now = new Date();
              setView(startOfMonth(now));
              setSelected(now);
            }}
          >
            {t.oggi}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setView((v) => addMonths(v, 1))}
          >
            {t.meseProssimo}
          </Button>
        </div>
      </header>

      <Card className="mb-6">
        <h2 className="text-base font-medium text-(--color-text) mb-4">
          {MONTHS[view.getMonth()]} {view.getFullYear()}
        </h2>
        <div className="grid grid-cols-7 gap-1 text-xs uppercase tracking-wider text-(--color-text-muted) mb-2">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((d) => {
            const count = byDay.get(dayKey(d.date))?.length ?? 0;
            const isSelected = sameDay(d.date, selected);
            return (
              <button
                key={d.date.toISOString()}
                type="button"
                onClick={() => setSelected(d.date)}
                className={[
                  "aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors p-1",
                  d.inMonth
                    ? "text-(--color-text)"
                    : "text-(--color-text-subtle)",
                  isSelected
                    ? "bg-(--color-accent) text-white"
                    : d.isToday
                    ? "bg-(--color-accent-soft) text-(--color-text)"
                    : "hover:bg-(--color-surface-muted)",
                ].join(" ")}
              >
                <span className="tabular-nums">{d.date.getDate()}</span>
                {count > 0 ? (
                  <span
                    className={[
                      "text-[10px] mt-0.5 px-1.5 rounded-full leading-tight",
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-(--color-accent) text-white",
                    ].join(" ")}
                  >
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </Card>

      <section className="print:block print:!mt-0">
        <header className="flex items-baseline justify-between mb-3 px-1">
          <h2 className="text-sm font-medium text-(--color-text)">
            {selected.toLocaleDateString("it-IT", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </h2>
          <div className="flex items-center gap-3">
            {todaysItems.length > 0 ? (
              <button
                type="button"
                onClick={() => window.print()}
                className="text-sm text-(--color-text-muted) hover:text-(--color-text) print:hidden"
              >
                Stampa
              </button>
            ) : null}
            {canCreate ? (
              <Link
                to={`/attivita/nuova?data=${dayKey(selected)}`}
                className="text-sm text-(--color-accent) hover:underline print:hidden"
              >
                + Nuova
              </Link>
            ) : null}
          </div>
        </header>
        {loading ? (
          <p className="text-sm text-(--color-text-muted)">{t.loading}</p>
        ) : todaysItems.length === 0 ? (
          <Card>
            <p className="text-sm text-(--color-text-muted) text-center py-4">
              {t.emptyDay}
            </p>
          </Card>
        ) : (
          <ul className="space-y-2">
            {todaysItems.map((a) => (
              <li key={a.id}>
                <Link to={`/attivita/${a.id}`} className="block">
                  <Card className="hover:border-(--color-border-strong) transition-colors">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-medium text-(--color-text) truncate">
                          {a.aziendaNome}
                        </p>
                        <p className="text-xs text-(--color-text-muted) mt-0.5">
                          {a.tipoNome} · {a.ownerName}
                        </p>
                      </div>
                      <span className="text-base font-medium text-(--color-text) tabular-nums">
                        {formatEuro(a.totale)}
                      </span>
                    </div>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
