import { useState } from "react";
import { AppShell, InlineError, PageHeader } from "../../../shared/ui";
import { useMediaQuery } from "../../../shared/lib/useMediaQuery";
import { useAuthState } from "../../auth";
import { agendaI18n as t } from "../i18n";
import { useAgendaData } from "../hooks/useAgendaData";
import { AgendaWeekStrip } from "./AgendaWeekStrip";
import { AgendaWeekNav } from "./AgendaWeekNav";
import { AgendaWeekBoard } from "./AgendaWeekBoard";
import { AgendaDayList } from "./AgendaDayList";

export function AgendaPage() {
  const [selected, setSelected] = useState<Date>(new Date());
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const { user } = useAuthState();
  const canCreate = user?.caps.has("activities.create") ?? false;
  const { items, reminders, loading, error } = useAgendaData({
    selectedDate: selected,
    viewMode: "week",
  });

  return (
    <AppShell wide>
      <PageHeader title={t.title} subtitle={t.subtitle} />

      {error ? (
        <InlineError className="mb-4">{t.loadError}</InlineError>
      ) : null}

      {isDesktop ? (
        <>
          <AgendaWeekNav selectedDate={selected} onSelectDate={setSelected} />
          <AgendaWeekBoard
            selectedDate={selected}
            items={items}
            canCreate={canCreate}
          />
        </>
      ) : (
        <>
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
        </>
      )}
    </AppShell>
  );
}
