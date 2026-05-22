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
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { useAuthState } from "../../auth";
import { allowlistI18n as t } from "../i18n";
import type { AllowlistEntry } from "@vet/shared";
import { AddAllowlistEntryForm } from "./AddAllowlistEntryForm";
import { AllowlistEntryRow } from "./AllowlistEntryRow";

interface AllowlistTabProps {
  entries: ReadonlyArray<AllowlistEntry>;
  roles: ReadonlyArray<{ id: string; name: string }>;
  loading: boolean;
  error: unknown;
  refresh: () => Promise<void>;
}

function countLabel(n: number): string {
  if (n === 0) return t.countZero;
  if (n === 1) return t.countOne;
  return t.countMany(n);
}

export function AllowlistTab({
  entries,
  roles,
  loading,
  error,
  refresh,
}: AllowlistTabProps) {
  const { user } = useAuthState();
  const { allowlist } = useRepositories();
  const canManage = user?.caps.has("allowlist.manage") ?? false;
  const [adding, setAdding] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState<string | null>(null);

  async function handleRemove(entry: AllowlistEntry): Promise<void> {
    if (!canManage) return;
    setBusy(true);
    setRemoveError(null);
    try {
      await allowlist.remove(entry.email);
      setConfirmingRemove(null);
      await refresh();
    } catch {
      setRemoveError(t.saveError);
    } finally {
      setBusy(false);
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
              allowlist={allowlist}
              user={user}
              onCancel={() => setAdding(false)}
              onAdded={async () => {
                setAdding(false);
                await refresh();
              }}
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
        <BoxedList>
          {entries.map((entry) => (
            <AllowlistEntryRow
              key={entry.emailNorm}
              entry={entry}
              roles={roles}
              canManage={canManage}
              busy={busy}
              onRemove={(e) => setConfirmingRemove(e.emailNorm)}
            />
          ))}
        </BoxedList>
      )}

      <ConfirmDialog
        open={target !== null}
        title={t.confermaRimozioneTitolo}
        message={t.confermaRimozione}
        confirmLabel={t.elimina}
        cancelLabel={t.annulla}
        variant="danger"
        busy={busy}
        onConfirm={() => {
          if (target) void handleRemove(target);
        }}
        onClose={() => setConfirmingRemove(null)}
      />
    </>
  );
}
