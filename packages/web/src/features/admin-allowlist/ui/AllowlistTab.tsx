import { useState } from "react";
import { Button, Card, ConfirmDialog } from "../../../shared/ui";
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

  return (
    <>
      {canManage && !adding ? (
        <div className="flex justify-end mb-6">
          <Button type="button" variant="primary" onClick={() => setAdding(true)}>
            {t.aggiungi}
          </Button>
        </div>
      ) : null}

      {removeError ? (
        <p role="alert" className="text-sm text-(--color-danger) mb-4">
          {removeError}
        </p>
      ) : null}

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

      {loading ? (
        <p className="text-sm text-(--color-text-muted)">{t.loading}</p>
      ) : error ? (
        <p className="text-sm text-(--color-danger)">{t.loadError}</p>
      ) : entries.length === 0 ? (
        <Card>
          <p className="text-sm text-(--color-text-muted) text-center py-4">
            {t.empty}
          </p>
        </Card>
      ) : (
        <ul className="space-y-2">
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
        </ul>
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
