import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Card, SectionLabel } from "../../../shared/ui";
import type { Reminder } from "@vet/shared";

interface DashboardRightRailProps {
  urgentReminders: ReadonlyArray<Reminder>;
  recentAziende: ReadonlyArray<{ id: string; nome: string }>;
  now: Date;
}

export function DashboardRightRail({
  urgentReminders,
  recentAziende,
  now,
}: DashboardRightRailProps) {
  return (
    <>
      {urgentReminders.length > 0 ? (
        <UrgentRemindersPanel reminders={urgentReminders} now={now} />
      ) : null}
      {recentAziende.length > 0 ? (
        <RecentAziendePanel aziende={recentAziende} />
      ) : null}
    </>
  );
}

function UrgentRemindersPanel({
  reminders,
  now,
}: {
  reminders: ReadonlyArray<Reminder>;
  now: Date;
}) {
  return (
    <Card className="border-(--color-accent)/40">
      <div className="flex items-baseline justify-between mb-2">
        <SectionLabel>Promemoria urgenti</SectionLabel>
        <Link
          to="/promemoria"
          className="inline-flex items-center gap-1 text-xs text-(--color-accent) hover:underline"
        >
          Tutti
          <ChevronRight size={12} strokeWidth={2} aria-hidden="true" />
        </Link>
      </div>
      <ul className="space-y-1.5">
        {reminders.map((r) => {
          const overdue = r.dueAt.getTime() < now.getTime();
          return (
            <li key={r.id} className="flex items-baseline justify-between gap-3">
              <span className="text-sm text-(--color-text) truncate">
                {r.titolo}{" "}
                <span className="text-(--color-text-muted)">· {r.aziendaNome}</span>
              </span>
              <span
                className={[
                  "text-xs tabular-nums flex-shrink-0",
                  overdue
                    ? "text-(--color-danger)"
                    : "text-(--color-text-muted)",
                ].join(" ")}
              >
                {r.dueAt.toLocaleDateString("it-IT")}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function RecentAziendePanel({
  aziende,
}: {
  aziende: ReadonlyArray<{ id: string; nome: string }>;
}) {
  return (
    <Card>
      <SectionLabel className="mb-3">Clienti recenti</SectionLabel>
      <ul className="space-y-1.5">
        {aziende.map((a) => (
          <li key={a.id}>
            <Link
              to={`/aziende/${a.id}`}
              className="block text-sm text-(--color-text) hover:text-(--color-accent) truncate"
            >
              {a.nome}
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
