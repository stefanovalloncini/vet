import { useMemo, useState } from "react";
import {
  ConfirmDialog,
  EmptyState,
  InlineError,
} from "../../../shared/ui";
import {
  DataGrid,
  dataGridIt,
  type Column,
} from "../../../shared/ui/data-grid";
import type { Role, User } from "@vet/shared";
import {
  useApprovePendingUser,
  usePendingUsers,
  useRejectPendingUser,
} from "../hooks/usePendingUsers";
import { allowlistI18n as t } from "../i18n";
import { PendingUserRow } from "./PendingUserRow";

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

  const columns = useMemo<ReadonlyArray<Column<User>>>(
    () => [
      {
        id: "email",
        header: t.colEmail,
        accessor: (u) => u.email,
        sortable: true,
      },
      {
        id: "requestedAt",
        header: t.colData,
        accessor: (u) => u.createdAt.getTime(),
        sortable: true,
      },
    ],
    []
  );

  return (
    <>
      {error ? <InlineError className="mb-4">{error}</InlineError> : null}

      <DataGrid<User>
        rows={items}
        columns={columns}
        getRowId={(u) => u.uid}
        mode="responsive"
        i18n={dataGridIt}
        loading={loading}
        error={loadError ? t.loadError : null}
        rowActions={[]}
        emptyState={<EmptyState title={t.pendingEmpty} />}
        card={(u) => (
          <PendingUserRow
            user={u}
            roleOptions={roleOptions}
            roleValue={roleByUid[u.uid] ?? u.roleId}
            busy={busyId === u.uid}
            onRoleChange={(roleId) =>
              setRoleByUid((r) => ({ ...r, [u.uid]: roleId }))
            }
            onApprove={handleApprove}
            onReject={setRejecting}
          />
        )}
      />

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
