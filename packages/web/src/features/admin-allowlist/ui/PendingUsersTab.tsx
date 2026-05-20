import { useState } from "react";
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Select,
} from "../../../shared/ui";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import type { Role, User } from "@vet/shared";
import { usePendingUsers } from "../hooks/usePendingUsers";
import { allowlistI18n as t } from "../i18n";

interface PendingUsersTabProps {
  roles: Role[];
}

export function PendingUsersTab({ roles }: PendingUsersTabProps) {
  const { users } = useRepositories();
  const { items, loading, refresh } = usePendingUsers();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<User | null>(null);
  const [roleByUid, setRoleByUid] = useState<Record<string, string>>({});

  async function approve(u: User) {
    setBusyId(u.uid);
    setError(null);
    try {
      const roleId = roleByUid[u.uid] ?? u.roleId;
      await users.approve(u.uid, roleId);
      await refresh();
    } catch {
      setError(t.pendingApprovaErrore);
    } finally {
      setBusyId(null);
    }
  }

  async function reject(u: User) {
    setBusyId(u.uid);
    setError(null);
    try {
      await users.delete(u.uid);
      setRejecting(null);
      await refresh();
    } catch {
      setError(t.pendingRifiutaErrore);
    } finally {
      setBusyId(null);
    }
  }

  const roleOptions = roles.map((r) => ({ value: r.id, label: r.name }));

  if (loading) {
    return <p className="text-sm text-(--color-text-muted)">{t.loading}</p>;
  }

  return (
    <>
      {error ? (
        <p role="alert" className="text-sm text-(--color-danger) mb-4">
          {error}
        </p>
      ) : null}

      {items.length === 0 ? (
        <Card>
          <EmptyState title={t.pendingEmpty} />
        </Card>
      ) : (
        <ul className="space-y-2">
          {items.map((u) => (
            <li key={u.uid}>
              <Card>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-medium text-(--color-text) truncate">
                      {u.email}
                    </p>
                    <p className="text-xs text-(--color-text-subtle) mt-1">
                      {u.displayName} · {t.pendingSignedUpAt}{" "}
                      {u.createdAt.toLocaleDateString("it-IT")}
                    </p>
                    <div className="mt-3 max-w-xs">
                      <Select
                        id={`role-${u.uid}`}
                        label={t.pendingRuolo}
                        value={roleByUid[u.uid] ?? u.roleId}
                        onChange={(e) =>
                          setRoleByUid((r) => ({ ...r, [u.uid]: e.target.value }))
                        }
                        options={roleOptions}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => approve(u)}
                      disabled={busyId === u.uid}
                    >
                      {t.pendingApprova}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setRejecting(u)}
                      disabled={busyId === u.uid}
                    >
                      {t.pendingRifiuta}
                    </Button>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={rejecting !== null}
        title={t.pendingConfermaRifiutoTitolo}
        message={t.pendingConfermaRifiuto}
        confirmLabel={t.pendingRifiuta}
        cancelLabel={t.annulla}
        variant="danger"
        busy={busyId !== null}
        onConfirm={() => {
          if (rejecting) void reject(rejecting);
        }}
        onClose={() => setRejecting(null)}
      />
    </>
  );
}
