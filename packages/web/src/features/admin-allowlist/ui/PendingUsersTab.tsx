import { useState } from "react";
import { Check, X } from "lucide-react";
import {
  Badge,
  BoxedList,
  Button,
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
        <EmptyState title={t.pendingEmpty} />
      ) : (
        <BoxedList>
          {items.map((u) => {
            const busy = busyId === u.uid;
            return (
              <li
                key={u.uid}
                className="px-4 py-3 grid grid-cols-1 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto] gap-3 sm:gap-4 sm:items-center"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-sm font-mono text-(--color-text) truncate">
                      {u.email}
                    </p>
                    <Badge tone="warning" aria-label={t.statoInAttesa}>
                      {t.statoInAttesa}
                    </Badge>
                  </div>
                  <p className="text-xs text-(--color-text-muted) mt-0.5 truncate">
                    {u.displayName}
                    <span className="text-(--color-text-subtle)">
                      {" · "}
                      {t.pendingSignedUpAt}{" "}
                    </span>
                    <span className="tabular-nums">
                      {u.createdAt.toLocaleDateString("it-IT")}
                    </span>
                  </p>
                </div>
                <div className="max-w-xs sm:max-w-none">
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
                <div className="flex items-center gap-1 justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleApprove(u)}
                    disabled={busy}
                    aria-label={t.pendingApprova}
                    leadingIcon={
                      <Check size={14} strokeWidth={1.75} aria-hidden="true" />
                    }
                  >
                    <span className="hidden md:inline">{t.pendingApprova}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setRejecting(u)}
                    disabled={busy}
                    aria-label={t.pendingRifiuta}
                    leadingIcon={
                      <X size={14} strokeWidth={1.75} aria-hidden="true" />
                    }
                  >
                    <span className="hidden md:inline">{t.pendingRifiuta}</span>
                  </Button>
                </div>
              </li>
            );
          })}
        </BoxedList>
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
