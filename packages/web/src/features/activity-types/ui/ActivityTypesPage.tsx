import { useMemo, useState, type ChangeEvent } from "react";
import { AppShell, Button, Card } from "../../../shared/ui";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { useAuthState } from "../../auth";
import { useActivityTypes } from "../hooks/useActivityTypes";
import { activityTypesI18n as t } from "../i18n";
import { GINECOLOGIA_TIPO_ID, type ActivityType } from "@vet/shared";

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

  async function saveTariffa(tipo: ActivityType, value: string) {
    if (!canManage) return;
    const trimmed = value.trim();
    const numeric = trimmed === "" ? null : Number(trimmed);
    if (numeric !== null && (!Number.isFinite(numeric) || numeric < 0)) {
      setGlobalError("Tariffa non valida");
      return;
    }
    setBusyId(tipo.id);
    setGlobalError(null);
    try {
      await repo.setStandardTariff(tipo.id, numeric);
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
                onSaveTariffa={(v) => saveTariffa(tipo, v)}
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
                  onSaveTariffa={(v) => saveTariffa(tipo, v)}
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
  onSaveTariffa,
  actionLabel,
}: {
  tipo: ActivityType;
  busy: boolean;
  canManage: boolean;
  onToggle: () => void;
  onSaveTariffa: (value: string) => void;
  actionLabel: string;
}) {
  const isGinecologia = tipo.id === GINECOLOGIA_TIPO_ID;
  const [tariffa, setTariffa] = useState<string>(
    tipo.tariffaStandard !== undefined ? String(tipo.tariffaStandard) : ""
  );
  const initial =
    tipo.tariffaStandard !== undefined ? String(tipo.tariffaStandard) : "";
  const dirty = tariffa !== initial;

  return (
    <Card padded={false} className="px-5 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
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
      {canManage && !isGinecologia ? (
        <div className="mt-3 flex items-center gap-2">
          <label
            htmlFor={`tariffa-${tipo.id}`}
            className="text-xs uppercase tracking-wider text-(--color-text-muted) w-32 shrink-0"
          >
            Tariffa standard
          </label>
          <input
            id={`tariffa-${tipo.id}`}
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={tariffa}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setTariffa(e.target.value)
            }
            placeholder="—"
            disabled={busy}
            className="w-28 rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-1.5 text-sm text-(--color-text) focus:outline-none focus:ring-2 focus:ring-(--color-accent)/20 focus:border-(--color-accent)"
          />
          <span className="text-xs text-(--color-text-muted)">€</span>
          {dirty ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => onSaveTariffa(tariffa)}
              disabled={busy}
            >
              Salva
            </Button>
          ) : null}
        </div>
      ) : null}
      {isGinecologia ? (
        <p className="mt-3 text-xs text-(--color-text-subtle)">
          Ginecologia: tariffa per cliente, ricordata dall&apos;ultima visita.
        </p>
      ) : null}
    </Card>
  );
}
