import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AppShell,
  Button,
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
import { cestinoI18n as t } from "../i18n";
import type { Attivita } from "@vet/shared";
import { CestinoRow } from "./CestinoRow";

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
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const canRestoreItem = useCallback(
    (a: Attivita): boolean =>
      canRestoreAny || (canRestoreOwn && a.ownerUid === user?.uid),
    [canRestoreAny, canRestoreOwn, user?.uid]
  );

  const actionableItems = useMemo(
    () => items.filter((a) => canPurge || canRestoreItem(a)),
    [items, canPurge, canRestoreItem]
  );
  const selectedItems = useMemo(
    () => actionableItems.filter((a) => selected.has(a.id)),
    [actionableItems, selected]
  );
  const allSelected =
    actionableItems.length > 0 && selectedItems.length === actionableItems.length;

  useEffect(() => {
    if (selected.size === 0) return;
    const validIds = new Set(actionableItems.map((a) => a.id));
    const next = new Set<string>();
    for (const id of selected) if (validIds.has(id)) next.add(id);
    if (next.size !== selected.size) setSelected(next);
  }, [actionableItems, selected]);

  function toggleOne(id: string, next: boolean): void {
    setSelected((prev) => {
      const out = new Set(prev);
      if (next) out.add(id);
      else out.delete(id);
      return out;
    });
  }

  function toggleAll(next: boolean): void {
    if (!next) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(actionableItems.map((a) => a.id)));
  }

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
    const toRestore = selectedItems.filter(canRestoreItem);
    if (toRestore.length === 0) return;
    setBulkBusy(true);
    setErrorMsg(null);
    try {
      for (const a of toRestore) {
        await restoreMutation.mutateAsync(a.id);
      }
      setSelected(new Set());
    } catch {
      setErrorMsg(t.errorRestore);
    } finally {
      setBulkBusy(false);
    }
  }

  async function handleBulkPurge(): Promise<void> {
    if (!canPurge || selectedItems.length === 0) return;
    setBulkBusy(true);
    setErrorMsg(null);
    try {
      for (const a of selectedItems) {
        await purgeMutation.mutateAsync(a.id);
      }
      setSelected(new Set());
      setConfirmingBulkPurge(false);
    } catch {
      setErrorMsg(t.errorPurge);
    } finally {
      setBulkBusy(false);
    }
  }

  const selectionCount = selectedItems.length;
  const canBulkRestore = selectedItems.some(canRestoreItem);
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
    <AppShell>
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
          <BulkBar
            total={actionableItems.length}
            selectionCount={selectionCount}
            allSelected={allSelected}
            busy={bulkBusy}
            canBulkRestore={canBulkRestore}
            canBulkPurge={canPurge}
            onSelectAll={toggleAll}
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
            selected={selected.has(a.id)}
            onSelectChange={(next) => toggleOne(a.id, next)}
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

interface BulkBarProps {
  total: number;
  selectionCount: number;
  allSelected: boolean;
  busy: boolean;
  canBulkRestore: boolean;
  canBulkPurge: boolean;
  onSelectAll: (next: boolean) => void;
  onRestore: () => void;
  onPurgeAsk: () => void;
}

function BulkBar({
  total,
  selectionCount,
  allSelected,
  busy,
  canBulkRestore,
  canBulkPurge,
  onSelectAll,
  onRestore,
  onPurgeAsk,
}: BulkBarProps) {
  const hasSelection = selectionCount > 0;
  return (
    <div
      role="toolbar"
      aria-label="Azioni cestino"
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 rounded-xl border border-(--color-border) bg-(--color-surface)"
    >
      <label className="inline-flex items-center gap-3 text-sm text-(--color-text) cursor-pointer select-none">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={(e) => onSelectAll(e.target.checked)}
          className="w-4 h-4 accent-(--color-accent)"
          aria-label={allSelected ? t.deseleziona : t.selezionaTutto}
          disabled={busy}
        />
        <span className="font-medium">
          {hasSelection ? t.selezionate(selectionCount) : t.contatore(total)}
        </span>
      </label>
      <div className="flex items-center gap-2">
        {canBulkRestore ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onRestore}
            disabled={busy || !hasSelection}
          >
            {t.ripristinaSelezionati}
          </Button>
        ) : null}
        {canBulkPurge ? (
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={onPurgeAsk}
            disabled={busy || !hasSelection}
          >
            {t.eliminaSelezionati}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
