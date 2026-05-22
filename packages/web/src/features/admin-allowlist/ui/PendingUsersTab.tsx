import { useState } from "react";
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  InlineError,
  LoadingHint,
  Select,
} from "../../../shared/ui";
import type { Role, User } from "@vet/shared";
import {
  useApprovePendingUser,
  usePendingUsers,
  useRejectPendingUser,
} from "../hooks/usePendingUsers";
import { allowlistI18n as t } from "../i18n";

interface PendingUsersTabProps {
  roles: Role[];
}

export function PendingUsersTab({ roles }: PendingUsersTabProps) {
  const { items, loading, error: loadError } = usePendingUsers();
  const approve = useApprovePendingUser();
  const reject = useRejectPendingUser();
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<User | null>(null);
  const [roleByUid, setRoleByUid] = useState<Record<string, string>>({});
  const busyId =
    approve.isPending && approve.variables
      ? approve.variables.uid
      : reject.isPending && reject.variables
        ? reject.variables
        : null;

  async function handleApprove(u: User): Promise<void> {
    setError(null);
    try {
      const roleId = roleByUid[u.uid] ?? u.roleId;
      await approve.mutateAsync({ uid: u.uid, roleId });
    } catch {
      setError(t.pendingApprovaErrore);
    }
  }

  async function handleReject(u: User): Promise<void> {
    setError(null);
    try {
      await reject.mutateAsync(u.uid);
      setRejecting(null);
    } catch {
      setError(t.pendingRifiutaErrore);
    }
  }

  const roleOptions = roles.map((r) => ({ value: r.id, label: r.name }));

  if (loading) return <LoadingHint label={t.loading} />;
  if (loadError) return <InlineError>{t.loadError}</InlineError>;

  return (
    <>
      {error ? <InlineError className="mb-4">{error}</InlineError> : null}

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
                      onClick={() => handleApprove(u)}
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
        busy={reject.isPending}
        onConfirm={() => {
          if (rejecting) void handleReject(rejecting);
        }}
        onClose={() => setRejecting(null)}
      />
    </>
  );
}
