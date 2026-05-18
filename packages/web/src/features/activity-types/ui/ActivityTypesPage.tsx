import { useMemo, useState } from "react";
import { AppShell, Button, Card } from "../../../shared/ui";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { useAuthState } from "../../auth";
import { useActivityTypes } from "../hooks/useActivityTypes";
import { activityTypesI18n as t } from "../i18n";
import type { ActivityType } from "@vet/shared";

export function ActivityTypesPage() {
  const { user } = useAuthState();
  const { types, loading, error, refresh } = useActivityTypes();
  const { activityTypes: repo } = useRepositories();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const canManage = user?.caps.has("activity_types.manage") ?? false;

  const [active, inactive] = useMemo(() => {
    const a: ActivityType[] = [];
    const i: ActivityType[] = [];
    for (const tipo of types) {
      (tipo.attivo ? a : i).push(tipo);
    }
    return [a, i];
  }, [types]);

  async function toggle(tipo: ActivityType) {
    if (!canManage) return;
    setBusyId(tipo.id);
    setGlobalError(null);
    try {
      await repo.setActive(tipo.id, !tipo.attivo);
      await refresh();
    } catch {
      setGlobalError(t.erroreSalvataggio);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AppShell>
      <header className="mb-8">
        <h1 className="text-3xl font-medium tracking-tight text-(--color-text)">
          {t.title}
        </h1>
        <p className="text-(--color-text-muted) mt-2 text-sm">{t.subtitle}</p>
        {!canManage ? (
          <p className="mt-3 text-xs text-(--color-text-subtle)">{t.readonly}</p>
        ) : null}
      </header>

      {globalError ? (
        <p role="alert" className="text-sm text-(--color-danger) mb-4">
          {globalError}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-(--color-text-muted)">{t.loading}</p>
      ) : error ? (
        <p className="text-sm text-(--color-danger)">{t.erroreSalvataggio}</p>
      ) : (
        <div className="space-y-8">
          <Section title={t.attivi} types={active}>
            {(tipo) => (
              <TypeRow
                tipo={tipo}
                busy={busyId === tipo.id}
                canManage={canManage}
                onToggle={() => toggle(tipo)}
                actionLabel={t.disattiva}
              />
            )}
          </Section>
          {inactive.length > 0 ? (
            <Section title={t.archiviati} types={inactive}>
              {(tipo) => (
                <TypeRow
                  tipo={tipo}
                  busy={busyId === tipo.id}
                  canManage={canManage}
                  onToggle={() => toggle(tipo)}
                  actionLabel={t.attiva}
                />
              )}
            </Section>
          ) : null}
        </div>
      )}
    </AppShell>
  );
}

function Section({
  title,
  types,
  children,
}: {
  title: string;
  types: ActivityType[];
  children: (tipo: ActivityType) => React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xs uppercase tracking-wider font-medium text-(--color-text-muted) mb-3">
        {title}
      </h2>
      <ul className="space-y-2">
        {types.map((tipo) => (
          <li key={tipo.id}>{children(tipo)}</li>
        ))}
      </ul>
    </section>
  );
}

function TypeRow({
  tipo,
  busy,
  canManage,
  onToggle,
  actionLabel,
}: {
  tipo: ActivityType;
  busy: boolean;
  canManage: boolean;
  onToggle: () => void;
  actionLabel: string;
}) {
  return (
    <Card padded={false} className="px-5 py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-base font-medium text-(--color-text)">{tipo.nome}</p>
          <p className="text-xs text-(--color-text-subtle) mt-1">
            id: <span className="font-mono">{tipo.id}</span> · ordine {tipo.ordine}
          </p>
        </div>
        {canManage ? (
          <Button
            type="button"
            variant={tipo.attivo ? "ghost" : "secondary"}
            size="sm"
            onClick={onToggle}
            disabled={busy}
          >
            {actionLabel}
          </Button>
        ) : (
          <span
            className={[
              "text-xs px-2 py-1 rounded-md",
              tipo.attivo
                ? "bg-(--color-accent-soft) text-(--color-text)"
                : "bg-(--color-surface-muted) text-(--color-text-muted)",
            ].join(" ")}
          >
            {tipo.attivo ? "attivo" : "inattivo"}
          </span>
        )}
      </div>
    </Card>
  );
}
