import { useCallback, useMemo, useState } from "react";
import {
  AppShell,
  ConfirmDialog,
  EmptyState,
  InlineError,
  PageHeader,
  Tabs,
} from "../../../shared/ui";
import {
  DataGrid,
  dataGridIt,
  type Column,
} from "../../../shared/ui/data-grid";
import { useAuthState } from "../../auth";
import { usePurgeTrashed, useRestoreTrashed, useTrash } from "../hooks/useTrash";
import { useTrashSelection } from "../hooks/useTrashSelection";
import { cestinoI18n as t } from "../i18n";
import type { Attivita } from "@vet/shared";
import { CestinoRow } from "./CestinoRow";
import { CestinoBulkBar } from "./CestinoBulkBar";

export function CestinoPage() {
  const { user } = useAuthState();

  const canSeeAny = user?.caps.has("trash.read.any") ?? false;
  const canRestoreAny = user?.caps.has("trash.restore.any") ?? false;
  const canRestoreOwn = user?.caps.has("trash.restore.own") ?? false;
  const canPurge = user?.caps.has("trash.purge") ?? false;

  const [view, setView] = useState<"mine" | "all">(canSeeAny ? "all" : "mine");

  const filters = useMemo<{ ownerUid?: string }>(
    () => (view === "mine" && user ? { ownerUid: user.uid } : {}),
    [view, user]
  );

  const { items, loading, error } = useTrash(filters);
  const restoreMutation = useRestoreTrashed();
  const purgeMutation = usePurgeTrashed();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [confirmingPurgeId, setConfirmingPurgeId] = useState<string | null>(null);
  const [confirmingBulkPurge, setConfirmingBulkPurge] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canRestoreItem = useCallback(
    (a: Attivita): boolean =>
      canRestoreAny || (canRestoreOwn && a.ownerUid === user?.uid),
    [canRestoreAny, canRestoreOwn, user?.uid]
  );

  const actionableItems = useMemo(
    () => items.filter((a) => canPurge || canRestoreItem(a)),
    [items, canPurge, canRestoreItem]
  );
  const selection = useTrashSelection(actionableItems);

  async function handleRestore(a: Attivita): Promise<void> {
    setBusyId(a.id);
    setErrorMsg(null);
    try {
      await restoreMutation.mutateAsync(a.id);
    } catch {
      setErrorMsg(t.errorRestore);
    } finally {
      setBusyId(null);
    }
  }

  async function handlePurge(a: Attivita): Promise<void> {
    setBusyId(a.id);
    setErrorMsg(null);
    try {
      await purgeMutation.mutateAsync(a.id);
      setConfirmingPurgeId(null);
    } catch {
      setErrorMsg(t.errorPurge);
    } finally {
      setBusyId(null);
    }
  }

  async function handleBulkRestore(): Promise<void> {
    const toRestore = selection.selectedItems.filter(canRestoreItem);
    if (toRestore.length === 0) return;
    setBulkBusy(true);
    setErrorMsg(null);
    try {
      for (const a of toRestore) {
        await restoreMutation.mutateAsync(a.id);
      }
      selection.clear();
    } catch {
      setErrorMsg(t.errorRestore);
    } finally {
      setBulkBusy(false);
    }
  }

  async function handleBulkPurge(): Promise<void> {
    if (!canPurge || selection.selectedItems.length === 0) return;
    setBulkBusy(true);
    setErrorMsg(null);
    try {
      for (const a of selection.selectedItems) {
        await purgeMutation.mutateAsync(a.id);
      }
      selection.clear();
      setConfirmingBulkPurge(false);
    } catch {
      setErrorMsg(t.errorPurge);
    } finally {
      setBulkBusy(false);
    }
  }

  const selectionCount = selection.selectionCount;
  const canBulkRestore = selection.selectedItems.some(canRestoreItem);
  const showTabs = canSeeAny;
  const showBulkBar = actionableItems.length > 0;

  const columns = useMemo<ReadonlyArray<Column<Attivita>>>(
    () => [
      {
        id: "data",
        header: "Data",
        accessor: (a) => a.data.getTime(),
        sortable: true,
      },
      {
        id: "azienda",
        header: "Azienda",
        accessor: (a) => a.aziendaNome,
        sortable: true,
      },
      {
        id: "tipo",
        header: "Tipo",
        accessor: (a) => a.tipoNome,
        filterId: "tipo",
      },
    ],
    []
  );

  return (
    <AppShell wide>
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        {...(showTabs
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

      {errorMsg ? (
        <div className="mb-4">
          <InlineError>{errorMsg}</InlineError>
        </div>
      ) : null}

      {showBulkBar && !loading && !error && items.length > 0 ? (
        <div className="mb-3">
          <CestinoBulkBar
            total={actionableItems.length}
            selectionCount={selectionCount}
            allSelected={selection.allSelected}
            busy={bulkBusy}
            canBulkRestore={canBulkRestore}
            canBulkPurge={canPurge}
            onSelectAll={selection.toggleAll}
            onRestore={handleBulkRestore}
            onPurgeAsk={() => setConfirmingBulkPurge(true)}
          />
        </div>
      ) : null}

      <DataGrid<Attivita>
        rows={items}
        columns={columns}
        getRowId={(a) => a.id}
        mode="responsive"
        i18n={dataGridIt}
        loading={loading}
        error={error ? t.loadError : null}
        rowActions={[]}
        emptyState={<EmptyState title={t.empty} description={t.emptyHint} />}
        card={(a) => (
          <CestinoRow
            attivita={a}
            busy={busyId === a.id || bulkBusy}
            canRestore={canRestoreItem(a)}
            canPurge={canPurge}
            selectable={canPurge || canRestoreItem(a)}
            selected={selection.selected.has(a.id)}
            onSelectChange={(next) => selection.toggleOne(a.id, next)}
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

      <ConfirmDialog
        open={confirmingBulkPurge}
        title={t.confermaPurgeBulkTitolo}
        message={t.confermaPurgeBulk(selectionCount)}
        confirmLabel={t.eliminaSelezionati}
        variant="danger"
        busy={bulkBusy}
        onConfirm={() => void handleBulkPurge()}
        onClose={() => {
          if (!bulkBusy) setConfirmingBulkPurge(false);
        }}
      />
    </AppShell>
  );
}

