import { useState } from "react";
import {
  BoxedList,
  Button,
  ConfirmDialog,
  EmptyState,
  InlineError,
  LoadingHint,
  SectionLabel,
} from "../../../shared/ui";
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

  if (loading) return <LoadingHint label={t.loading} />;
  if (error) return <InlineError>{t.loadError}</InlineError>;

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

      {entries.length === 0 ? (
        <EmptyState title={t.empty} />
      ) : (
        <div className="space-y-1.5">
          <div
            aria-hidden="true"
            className="hidden sm:grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-4 px-4 text-[11px] uppercase tracking-wider text-(--color-text-subtle)"
          >
            <span>{t.colEmail}</span>
            <span>{t.colRuolo}</span>
            <span>{t.colData}</span>
            <span className="text-right">{t.colAzioni}</span>
          </div>
          <BoxedList>
            {entries.map((entry) => (
              <AllowlistEntryRow
                key={entry.emailNorm}
                entry={entry}
                roles={roles}
                canManage={canManage}
                busy={remove.isPending}
                onRemove={(e) => setConfirmingRemove(e.emailNorm)}
              />
            ))}
          </BoxedList>
        </div>
      )}

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
