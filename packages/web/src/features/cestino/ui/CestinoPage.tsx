import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { AppShell, ConfirmDialog, EmptyState, Tabs } from "../../../shared/ui";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { useAuthState } from "../../auth";
import { useTrash } from "../hooks/useTrash";
import { cestinoI18n as t } from "../i18n";
import type { Attivita } from "@vet/shared";
import { CestinoRow } from "./CestinoRow";

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
          <Tabs
            items={[
              { value: "mine", label: t.viewMine },
              { value: "all", label: t.viewAll },
            ]}
            value={view}
            onChange={setView}
            size="sm"
          />
        ) : null}
      </header>

      {errorMsg ? (
        <p role="alert" className="text-sm text-(--color-danger) mb-4">
          {errorMsg}
        </p>
      ) : null}

      <TrashBody
        loading={loading}
        error={error}
        items={items}
        renderRow={(a) => (
          <CestinoRow
            attivita={a}
            busy={busyId === a.id}
            canRestore={canRestoreAny || (canRestoreOwn && a.ownerUid === user?.uid)}
            canPurge={canPurge}
            onRestore={() => handleRestore(a)}
            onPurgeAsk={() => setConfirmingPurgeId(a.id)}
          />
        )}
      />

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

function TrashBody({
  loading,
  error,
  items,
  renderRow,
}: {
  loading: boolean;
  error: string | null;
  items: Attivita[];
  renderRow: (a: Attivita) => ReactNode;
}) {
  if (loading) return <p className="text-sm text-(--color-text-muted)">{t.loading}</p>;
  if (error) return <p className="text-sm text-(--color-danger)">{t.loadError}</p>;
  if (items.length === 0) return <EmptyState title={t.empty} />;
  return (
    <ul className="space-y-2">
      {items.map((a) => (
        <li key={a.id}>{renderRow(a)}</li>
      ))}
    </ul>
  );
}
