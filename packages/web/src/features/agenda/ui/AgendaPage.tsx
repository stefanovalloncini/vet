import { useState } from "react";
import { AppShell, InlineError, PageHeader } from "../../../shared/ui";
import { agendaI18n as t } from "../i18n";
import { useAgendaData } from "../hooks/useAgendaData";
import { AgendaWeekStrip } from "./AgendaWeekStrip";
import { AgendaDayList } from "./AgendaDayList";

export function AgendaPage() {
  const [selected, setSelected] = useState<Date>(new Date());
  const { items, reminders, loading, error } = useAgendaData({
    selectedDate: selected,
    viewMode: "month",
  });

  return (
    <AppShell>
      <PageHeader title={t.title} subtitle={t.subtitle} />

      {error ? (
        <InlineError className="mb-4">{t.loadError}</InlineError>
      ) : null}

      <AgendaWeekStrip
        selectedDate={selected}
        items={items}
        onSelectDate={setSelected}
      />
      <AgendaDayList
        date={selected}
        items={items}
        reminders={reminders}
        loading={loading}
      />
    </AppShell>
  );
}
