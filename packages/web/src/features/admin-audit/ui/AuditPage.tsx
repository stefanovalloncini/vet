import { useMemo, useState } from "react";
import {
  AppShell,
  BoxedList,
  EmptyState,
  InlineError,
  LoadingHint,
  PageHeader,
  SectionLabel,
  Select,
} from "../../../shared/ui";
import { useAuditEvents } from "../hooks/useAuditEvents";
import { ACTION_LABELS, auditI18n as t } from "../i18n";
import type { AuditAction, AuditEvent, AuditFilters } from "@vet/shared";

type TargetType = NonNullable<AuditFilters["targetType"]>;

const TARGET_TYPES: Array<{ value: TargetType | ""; label: string }> = [
  { value: "", label: t.filtroTutti },
  { value: "role", label: "Ruolo" },
  { value: "user", label: "Utente" },
  { value: "attivita", label: "Attività" },
  { value: "azienda", label: "Azienda" },
  { value: "allowlist", label: "Allowlist" },
  { value: "activity_type", label: "Tipo attività" },
  { value: "access_request", label: "Richiesta accesso" },
];

const ACTIONS: Array<{ value: AuditAction | ""; label: string }> = [
  { value: "", label: t.filtroTutti },
  ...(Object.entries(ACTION_LABELS) as Array<[AuditAction, string]>).map(
    ([v, label]) => ({ value: v, label })
  ),
];

export function AuditPage() {
  const [filterAction, setFilterAction] = useState<AuditAction | "">("");
  const [filterTarget, setFilterTarget] = useState<TargetType | "">("");

  const filters: AuditFilters = {
    ...(filterAction ? { action: filterAction } : {}),
    ...(filterTarget ? { targetType: filterTarget } : {}),
  };
  const { data, isLoading, isError } = useAuditEvents(filters);
  const events = data ?? [];

  const grouped = useMemo(() => {
    const map = new Map<string, AuditEvent[]>();
    for (const e of events) {
      const day = e.at.toLocaleDateString("it-IT", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      const existing = map.get(day) ?? [];
      existing.push(e);
      map.set(day, existing);
    }
    return [...map.entries()];
  }, [events]);

  return (
    <AppShell>
      <PageHeader title={t.title} subtitle={t.subtitle} />

      <div className="border-y border-(--color-border) py-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            id="filter-action"
            label={t.filtroAzione}
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value as AuditAction | "")}
            options={ACTIONS}
          />
          <Select
            id="filter-target"
            label={t.filtroTarget}
            value={filterTarget}
            onChange={(e) => setFilterTarget(e.target.value as TargetType | "")}
            options={TARGET_TYPES}
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingHint label={t.loading} />
      ) : isError ? (
        <InlineError>{t.loadError}</InlineError>
      ) : events.length === 0 ? (
        <EmptyState title={t.empty} />
      ) : (
        <div className="space-y-6">
          {grouped.map(([day, dayEvents]) => (
            <section key={day}>
              <SectionLabel as="h2" className="mb-3">
                {day}
              </SectionLabel>
              <BoxedList>
                {dayEvents.map((e) => (
                  <li key={e.id} className="px-5 py-4">
                    <div className="flex items-baseline gap-4">
                      <span className="text-xs text-(--color-text-subtle) tabular-nums shrink-0 w-12">
                        {e.at.toLocaleTimeString("it-IT", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-(--color-text)">
                          {ACTION_LABELS[e.action] ?? e.action}
                          <span className="text-(--color-text-muted)">
                            {" · "}
                            {e.actorEmail || e.actorUid}
                          </span>
                        </p>
                        <p className="text-xs text-(--color-text-subtle) mt-1 font-mono">
                          {e.targetType}/{e.targetId}
                        </p>
                        {e.details ? (
                          <details className="mt-2">
                            <summary className="text-[11px] text-(--color-text-subtle) cursor-pointer hover:text-(--color-text-muted)">
                              Dettagli
                            </summary>
                            <pre className="text-[11px] text-(--color-text-subtle) mt-2 overflow-x-auto whitespace-pre-wrap bg-(--color-surface-muted) rounded-md p-2 font-mono">
                              {JSON.stringify(e.details, null, 0)}
                            </pre>
                          </details>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </BoxedList>
            </section>
          ))}
        </div>
      )}
    </AppShell>
  );
}
