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
import { dateInputValue, formatEuro } from "../../attivita/lib/format";
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
      const k = dateInputValue(a.data);
      const arr = m.get(k) ?? [];
      arr.push(a);
      m.set(k, arr);
    }
    return m;
  }, [items]);

  const todaysItems = byDay.get(dateInputValue(selected)) ?? [];

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

      <div className="lg:grid lg:grid-cols-[minmax(0,460px)_1fr] lg:gap-6 lg:items-start">
        <Card className="mb-6 lg:mb-0 lg:sticky lg:top-6 !p-4 sm:!p-5">
          <h2 className="text-sm font-medium text-(--color-text) mb-3 capitalize">
            {MONTHS[view.getMonth()]} {view.getFullYear()}
          </h2>
          <div className="grid grid-cols-7 gap-0.5 text-[10px] uppercase tracking-[0.06em] text-(--color-text-subtle) mb-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {days.map((d) => {
              const count = byDay.get(dateInputValue(d.date))?.length ?? 0;
              const isSelected = sameDay(d.date, selected);
              return (
                <button
                  key={d.date.toISOString()}
                  type="button"
                  onClick={() => setSelected(d.date)}
                  aria-pressed={isSelected}
                  className={[
                    "aspect-square flex flex-col items-center justify-center gap-0.5 rounded-md text-sm",
                    "transition-[background-color,color] duration-(--motion-fast) ease-(--ease-out-quart)",
                    "active:scale-[0.97] active:duration-(--motion-press)",
                    d.inMonth
                      ? "text-(--color-text)"
                      : "text-(--color-text-subtle)",
                    isSelected
                      ? "bg-(--color-accent) text-white font-medium"
                      : d.isToday
                      ? "bg-(--color-accent-soft) text-(--color-accent) font-medium"
                      : "hover:bg-(--color-surface-muted)",
                  ].join(" ")}
                >
                  <span className="tabular-nums leading-none">
                    {d.date.getDate()}
                  </span>
                  {count > 0 ? (
                    <span
                      className={[
                        "w-1 h-1 rounded-full",
                        isSelected ? "bg-white" : "bg-(--color-accent)",
                      ].join(" ")}
                      aria-label={`${count} attività`}
                    />
                  ) : (
                    <span className="w-1 h-1" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        <section className="print:block print:!mt-0 min-w-0">
          <header className="flex items-baseline justify-between mb-3 px-1 gap-3">
            <h2 className="text-sm font-medium text-(--color-text) capitalize truncate">
              {selected.toLocaleDateString("it-IT", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </h2>
            <div className="flex items-center gap-3 shrink-0">
              {todaysItems.length > 0 ? (
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="text-sm text-(--color-text-muted) hover:text-(--color-text) print:hidden transition-colors"
                >
                  Stampa
                </button>
              ) : null}
              {canCreate ? (
                <Link
                  to={`/attivita/nuova?data=${dateInputValue(selected)}`}
                  className="text-sm text-(--color-accent) hover:underline print:hidden"
                >
                  + Nuova
                </Link>
              ) : null}
            </div>
          </header>
          {loading ? (
            <p className="text-sm text-(--color-text-muted) px-1">{t.loading}</p>
          ) : todaysItems.length === 0 ? (
            <p className="text-sm text-(--color-text-muted) px-1 py-2">
              {t.emptyDay}
            </p>
          ) : (
            <ul className="space-y-2">
              {todaysItems.map((a) => (
                <li key={a.id}>
                  <Link to={`/attivita/${a.id}`} className="block">
                    <Card className="hover:border-(--color-border-strong)">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-medium text-(--color-text) truncate">
                            {a.aziendaNome}
                          </p>
                          <p className="text-xs text-(--color-text-muted) mt-0.5 truncate">
                            {a.tipoNome} · {a.ownerName}
                          </p>
                        </div>
                        <span className="text-base font-medium text-(--color-text) tabular-nums shrink-0">
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
      </div>
    </AppShell>
  );
}
