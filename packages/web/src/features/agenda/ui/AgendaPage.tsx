import { useState } from "react";
import { AppShell, Button, PageHeader } from "../../../shared/ui";
import { agendaI18n as t } from "../i18n";
import { addMonths, startOfMonth } from "../lib/calendar";
import { useAgendaData, type AgendaViewMode } from "../hooks/useAgendaData";
import { AgendaCalendar } from "./AgendaCalendar";
import { AgendaDayList } from "./AgendaDayList";

export function AgendaPage() {
  const [selected, setSelected] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<AgendaViewMode>("month");
  const { items, reminders, loading } = useAgendaData({
    selectedDate: selected,
    viewMode,
  });

  const goToToday = () => setSelected(new Date());
  const shiftMonth = (delta: number) =>
    setSelected((d) => addMonths(startOfMonth(d), delta));

  return (
    <AppShell>
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        actions={
          <>
            <Button type="button" variant="ghost" size="sm" onClick={() => shiftMonth(-1)}>
              {t.meseScorso}
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={goToToday}>
              {t.oggi}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => shiftMonth(1)}>
              {t.meseProssimo}
            </Button>
          </>
        }
      />

      <div className="lg:grid lg:grid-cols-[minmax(0,460px)_1fr] lg:gap-6 lg:items-start">
        <AgendaCalendar
          selectedDate={selected}
          viewMode={viewMode}
          items={items}
          reminders={reminders}
          onSelectDate={setSelected}
          onChangeViewMode={setViewMode}
        />
        <AgendaDayList
          date={selected}
          items={items}
          reminders={reminders}
          loading={loading}
        />
      </div>
    </AppShell>
  );
}
