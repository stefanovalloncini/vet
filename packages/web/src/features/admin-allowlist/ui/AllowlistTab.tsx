import { useMemo, useState } from "react";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  InlineError,
  SectionLabel,
} from "../../../shared/ui";
import {
  DataGrid,
  dataGridIt,
  type Column,
} from "../../../shared/ui/data-grid";
import { useAuthState } from "../../auth";
import { allowlistI18n as t } from "../i18n";
import type { AllowlistEntry } from "@vet/shared";
import { useRemoveAllowlistEntry } from "../hooks/useAllowlist";
import { AddAllowlistEntryForm } from "./AddAllowlistEntryForm";
import { AllowlistEntryRow } from "./AllowlistEntryRow";

interface AllowlistTabProps {
  entries: ReadonlyArray<AllowlistEntry>;
  roles: ReadonlyArray<{ id: string; name: string }>;
  loading: boolean;
  error: unknown;
}

function countLabel(n: number): string {
  if (n === 0) return t.countZero;
  if (n === 1) return t.countOne;
  return t.countMany(n);
}

export function AllowlistTab({ entries, roles, loading, error }: AllowlistTabProps) {
  const { user } = useAuthState();
  const canManage = user?.caps.has("allowlist.manage") ?? false;
  const remove = useRemoveAllowlistEntry();
  const [adding, setAdding] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [confirmingRemove, setConfirmingRemove] = useState<string | null>(null);

  async function handleRemove(entry: AllowlistEntry): Promise<void> {
    if (!canManage) return;
    setRemoveError(null);
    try {
      await remove.mutateAsync(entry.email);
      setConfirmingRemove(null);
    } catch {
      setRemoveError(t.saveError);
    }
  }

  const target =
    confirmingRemove !== null
      ? entries.find((e) => e.emailNorm === confirmingRemove) ?? null
      : null;

  const roleNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of roles) map.set(r.id, r.name);
    return map;
  }, [roles]);

  const columns = useMemo<ReadonlyArray<Column<AllowlistEntry>>>(
    () => [
      {
        id: "email",
        header: t.colEmail,
        accessor: (e) => e.email,
        sortable: true,
      },
      {
        id: "ruolo",
        header: t.colRuolo,
        accessor: (e) => roleNameById.get(e.defaultRoleId) ?? e.defaultRoleId,
        filterId: "ruolo",
      },
    ],
    [roleNameById]
  );

  return (
    <>
      {canManage ? (
        <div className="flex items-baseline justify-between gap-3 mb-3">
          <SectionLabel>{countLabel(entries.length)}</SectionLabel>
          {!adding ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setAdding(true)}
            >
              + {t.aggiungiBreve}
            </Button>
          ) : null}
        </div>
      ) : null}

      <div
        className="grid overflow-hidden"
        style={{
          gridTemplateRows: adding ? "1fr" : "0fr",
          transition:
            "grid-template-rows var(--motion-layout) var(--ease-out-quint)",
        }}
      >
        <div className="min-h-0 overflow-hidden">
          {adding && user ? (
            <AddAllowlistEntryForm
              roles={roles}
              user={user}
              onCancel={() => setAdding(false)}
              onAdded={() => setAdding(false)}
            />
          ) : null}
        </div>
      </div>

      {removeError ? (
        <InlineError className="mb-3">{removeError}</InlineError>
      ) : null}

      <DataGrid<AllowlistEntry>
        rows={entries}
        columns={columns}
        getRowId={(e) => e.emailNorm}
        mode="responsive"
        cardsLayout="list"
        i18n={dataGridIt}
        loading={loading}
        error={error ? t.loadError : null}
        rowActions={[]}
        emptyState={<EmptyState title={t.empty} />}
        card={(entry) => (
          <AllowlistEntryRow
            entry={entry}
            roles={roles}
            canManage={canManage}
            busy={remove.isPending}
            onRemove={(e) => setConfirmingRemove(e.emailNorm)}
          />
        )}
      />

      <ConfirmDialog
        open={target !== null}
        title={t.confermaRimozioneTitolo}
        message={t.confermaRimozione}
        confirmLabel={t.elimina}
        cancelLabel={t.annulla}
        variant="danger"
        busy={remove.isPending}
        onConfirm={() => {
          if (target) void handleRemove(target);
        }}
        onClose={() => setConfirmingRemove(null)}
      />
    </>
  );
}
