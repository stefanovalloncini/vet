import { useMemo, useState } from "react";
import {
  AppShell,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  InlineError,
  LoadingHint,
  PageHeader,
  Tabs,
} from "../../../shared/ui";
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
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        {...(canSeeAny
          ? {
              actions: (
                <Tabs
                  items={[
                    { value: "mine", label: t.viewMine },
                    { value: "all", label: t.viewAll },
                  ]}
                  value={view}
                  onChange={setView}
                  size="sm"
                />
              ),
            }
          : {})}
      />

      {errorMsg ? <InlineError className="mb-4">{errorMsg}</InlineError> : null}

      {loading ? (
        <LoadingHint label={t.loading} />
      ) : error ? (
        <InlineError>{t.loadError}</InlineError>
      ) : items.length === 0 ? (
        <EmptyState title={t.empty} />
      ) : (
        <ul className="space-y-2">
          {items.map((a) => (
            <li key={a.id}>
              <TrashRow
                attivita={a}
                busy={busyId === a.id}
                canRestore={
                  canRestoreAny || (canRestoreOwn && a.ownerUid === user?.uid)
                }
                canPurge={canPurge}
                onRestore={() => handleRestore(a)}
                onPurgeAsk={() => setConfirmingPurgeId(a.id)}
              />
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={confirmingPurgeId !== null}
        title={t.confermaPurgeTitolo}
        message={t.confermaPurge}
        confirmLabel={t.elimina}
        variant="danger"
        busy={confirmingPurgeId !== null && busyId === confirmingPurgeId}
        onConfirm={() => {
          const target = items.find((i) => i.id === confirmingPurgeId);
          if (target) void handlePurge(target);
        }}
        onClose={() => setConfirmingPurgeId(null)}
      />
    </AppShell>
  );
}

function TrashRow({
  attivita: a,
  busy,
  canRestore,
  canPurge,
  onRestore,
  onPurgeAsk,
}: {
  attivita: Attivita;
  busy: boolean;
  canRestore: boolean;
  canPurge: boolean;
  onRestore: () => void;
  onPurgeAsk: () => void;
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
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {canRestore ? (
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
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onPurgeAsk}
              disabled={busy}
            >
              {t.elimina}
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
