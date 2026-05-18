import { useEffect, useMemo, useState } from "react";
import { AppShell, Card, Select } from "../../../shared/ui";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { ACTION_LABELS, auditI18n as t } from "../i18n";
import type { AuditAction, AuditEvent } from "@vet/shared";

const TARGET_TYPES = [
  { value: "", label: t.filtroTutti },
  { value: "role", label: "Ruolo" },
  { value: "user", label: "Utente" },
  { value: "attivita", label: "Attività" },
  { value: "azienda", label: "Azienda" },
  { value: "allowlist", label: "Allowlist" },
  { value: "activity_type", label: "Tipo attività" },
];

const ACTIONS: Array<{ value: AuditAction | ""; label: string }> = [
  { value: "", label: t.filtroTutti },
  ...(Object.entries(ACTION_LABELS) as Array<[AuditAction, string]>).map(
    ([v, label]) => ({ value: v, label })
  ),
];

export function AuditPage() {
  const { audit } = useRepositories();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState<AuditAction | "">("");
  const [filterTarget, setFilterTarget] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const filters: Record<string, unknown> = { limit: 200 };
        if (filterAction) filters["action"] = filterAction;
        if (filterTarget) filters["targetType"] = filterTarget;
        const list = await audit.list(filters);
        if (!cancelled) {
          setEvents(list);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError("load-failed");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [audit, filterAction, filterTarget]);

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
      <header className="mb-8">
        <h1 className="text-3xl text-(--color-text)">{t.title}</h1>
        <p className="text-(--color-text-muted) mt-2 text-sm">{t.subtitle}</p>
      </header>

      <Card className="mb-6">
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
            onChange={(e) => setFilterTarget(e.target.value)}
            options={TARGET_TYPES}
          />
        </div>
      </Card>

      {loading ? (
        <p className="text-sm text-(--color-text-muted)">{t.loading}</p>
      ) : error ? (
        <p className="text-sm text-(--color-danger)">{t.loadError}</p>
      ) : events.length === 0 ? (
        <Card>
          <p className="text-sm text-(--color-text-muted) text-center py-4">
            {t.empty}
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped.map(([day, dayEvents]) => (
            <section key={day}>
              <h2 className="text-xs uppercase tracking-wider text-(--color-text-muted) mb-3">
                {day}
              </h2>
              <ul className="space-y-2">
                {dayEvents.map((e) => (
                  <li key={e.id}>
                    <Card padded={false} className="px-5 py-3">
                      <div className="flex items-start gap-3">
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-(--color-accent) mt-2 flex-shrink-0"
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                            <span className="text-sm font-medium text-(--color-text)">
                              {ACTION_LABELS[e.action] ?? e.action}
                            </span>
                            <span className="text-xs text-(--color-text-subtle) tabular-nums">
                              {e.at.toLocaleTimeString("it-IT", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-(--color-text-muted) mt-1">
                            <span>{e.actorEmail || e.actorUid}</span>
                            {" · "}
                            <span className="font-mono">
                              {e.targetType}/{e.targetId}
                            </span>
                          </p>
                          {e.details ? (
                            <pre className="text-[11px] text-(--color-text-subtle) mt-2 overflow-x-auto whitespace-pre-wrap bg-(--color-surface-muted) rounded-md p-2 font-mono">
                              {JSON.stringify(e.details, null, 0)}
                            </pre>
                          ) : null}
                        </div>
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </AppShell>
  );
}
