import { useMemo, useState } from "react";
import { AppShell, Button, Card } from "../../../shared/ui";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { useAuthState } from "../../auth";
import { useTrash } from "../hooks/useTrash";
import { cestinoI18n as t } from "../i18n";
import type { Attivita } from "@vet/shared";
import { formatDate, formatEuro } from "../../attivita/lib/format";

export function CestinoPage() {
  const { user } = useAuthState();
  const { trash } = useRepositories();

  const canSeeAny = user?.caps.has("trash.read.any") ?? false;
  const canRestoreAny = user?.caps.has("trash.restore.any") ?? false;
  const canRestoreOwn = user?.caps.has("trash.restore.own") ?? false;
  const canPurge = user?.caps.has("trash.purge") ?? false;

  const [view, setView] = useState<"mine" | "all">(canSeeAny ? "all" : "mine");

  const filters = useMemo(
    () =>
      view === "mine" && user
        ? { ownerUid: user.uid }
        : ({} as { ownerUid?: string }),
    [view, user]
  );

  const { items, loading, error, refresh } = useTrash(filters);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmingPurgeId, setConfirmingPurgeId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleRestore(a: Attivita) {
    setBusyId(a.id);
    setErrorMsg(null);
    try {
      await trash.restoreAttivita(a.id);
      await refresh();
    } catch {
      setErrorMsg(t.errorRestore);
    } finally {
      setBusyId(null);
    }
  }

  async function handlePurge(a: Attivita) {
    setBusyId(a.id);
    setErrorMsg(null);
    try {
      await trash.purgeAttivita(a.id);
      setConfirmingPurgeId(null);
      await refresh();
    } catch {
      setErrorMsg(t.errorPurge);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AppShell>
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-(--color-text)">
            {t.title}
          </h1>
          <p className="text-(--color-text-muted) mt-2 text-sm max-w-prose">
            {t.subtitle}
          </p>
        </div>
        {canSeeAny ? (
          <div
            role="tablist"
            className="inline-flex rounded-xl bg-(--color-surface-muted) p-1 border border-(--color-border)"
          >
            <ViewToggle
              active={view === "mine"}
              onClick={() => setView("mine")}
              label={t.viewMine}
            />
            <ViewToggle
              active={view === "all"}
              onClick={() => setView("all")}
              label={t.viewAll}
            />
          </div>
        ) : null}
      </header>

      {errorMsg ? (
        <p role="alert" className="text-sm text-(--color-danger) mb-4">
          {errorMsg}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-(--color-text-muted)">{t.loading}</p>
      ) : error ? (
        <p className="text-sm text-(--color-danger)">{t.loadError}</p>
      ) : items.length === 0 ? (
        <Card>
          <p className="text-sm text-(--color-text-muted) text-center py-4">
            {t.empty}
          </p>
        </Card>
      ) : (
        <ul className="space-y-2">
          {items.map((a) => (
            <li key={a.id}>
              <TrashRow
                attivita={a}
                busy={busyId === a.id}
                confirmingPurge={confirmingPurgeId === a.id}
                canRestore={
                  canRestoreAny || (canRestoreOwn && a.ownerUid === user?.uid)
                }
                canPurge={canPurge}
                onRestore={() => handleRestore(a)}
                onPurgeAsk={() => setConfirmingPurgeId(a.id)}
                onPurgeCancel={() => setConfirmingPurgeId(null)}
                onPurgeConfirm={() => handlePurge(a)}
              />
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}

function ViewToggle({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={[
        "px-3 py-1 text-xs font-medium rounded-lg transition-colors",
        active
          ? "bg-(--color-surface) text-(--color-text) shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
          : "text-(--color-text-muted) hover:text-(--color-text)",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function TrashRow({
  attivita: a,
  busy,
  confirmingPurge,
  canRestore,
  canPurge,
  onRestore,
  onPurgeAsk,
  onPurgeCancel,
  onPurgeConfirm,
}: {
  attivita: Attivita;
  busy: boolean;
  confirmingPurge: boolean;
  canRestore: boolean;
  canPurge: boolean;
  onRestore: () => void;
  onPurgeAsk: () => void;
  onPurgeCancel: () => void;
  onPurgeConfirm: () => void;
}) {
  return (
    <Card className="hover:border-(--color-border-strong) transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-sm text-(--color-text-muted) tabular-nums">
              {formatDate(a.data)}
            </span>
            <h2 className="text-base font-medium text-(--color-text) truncate">
              {a.aziendaNome}
            </h2>
            <span className="text-sm text-(--color-text-muted)">
              {a.tipoNome}
            </span>
            <span className="text-base font-medium text-(--color-text) tabular-nums">
              {formatEuro(a.totale)}
            </span>
          </div>
          <p className="text-xs text-(--color-text-subtle) mt-2">
            {a.ownerName}
            {a.deletedAt ? ` · ${t.deletedAt} ${formatDate(a.deletedAt)}` : ""}
          </p>
          {confirmingPurge ? (
            <p className="text-xs text-(--color-danger) mt-2">
              {t.confermaPurge}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {canRestore && !confirmingPurge ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onRestore}
              disabled={busy}
            >
              {t.ripristina}
            </Button>
          ) : null}
          {canPurge ? (
            confirmingPurge ? (
              <>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={onPurgeConfirm}
                  disabled={busy}
                >
                  {t.elimina}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onPurgeCancel}
                  disabled={busy}
                >
                  Annulla
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onPurgeAsk}
                disabled={busy}
              >
                {t.elimina}
              </Button>
            )
          ) : null}
        </div>
      </div>
    </Card>
  );
}
