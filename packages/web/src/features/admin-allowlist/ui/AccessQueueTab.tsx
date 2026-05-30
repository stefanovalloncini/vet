import { useMemo, useState } from "react";
import { ConfirmDialog, EmptyState, InlineError } from "../../../shared/ui";
import {
  DataGrid,
  dataGridIt,
  type Column,
} from "../../../shared/ui/data-grid";
import {
  useApprovePendingUser,
  usePendingUsers,
  useRejectPendingUser,
} from "../hooks/usePendingUsers";
import {
  useAccessRequests,
  useRejectAccessRequest,
} from "../hooks/useAccessRequests";
import { allowlistI18n as t } from "../i18n";
import {
  mergeAccessQueue,
  type AccessQueueRow as QueueRow,
} from "../lib/mergeAccessQueue";
import { AccessQueueRow } from "./AccessQueueRow";
import { AcceptAccessRequestDialog } from "./AcceptAccessRequestDialog";

interface AccessQueueTabProps {
  roles: ReadonlyArray<{ id: string; name: string }>;
}

export function AccessQueueTab({ roles }: AccessQueueTabProps) {
  const pending = usePendingUsers();
  const requests = useAccessRequests();
  const approvePending = useApprovePendingUser();
  const rejectPending = useRejectPendingUser();
  const rejectRequest = useRejectAccessRequest();
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState<QueueRow | null>(null);
  const [rejecting, setRejecting] = useState<QueueRow | null>(null);
  const [roleByUid, setRoleByUid] = useState<Record<string, string>>({});

  const rows = useMemo(
    () => mergeAccessQueue(pending.items, requests.items),
    [pending.items, requests.items]
  );

  const busy =
    approvePending.isPending ||
    rejectPending.isPending ||
    rejectRequest.isPending;

  async function handleAccept(row: QueueRow): Promise<void> {
    if (row.kind !== "pending") {
      setAccepting(row);
      return;
    }
    setError(null);
    try {
      const roleId = roleByUid[row.user.uid] ?? row.user.roleId;
      await approvePending.mutateAsync({ uid: row.user.uid, roleId });
    } catch {
      setError(t.pendingApprovaErrore);
    }
  }

  async function handleReject(row: QueueRow): Promise<void> {
    setError(null);
    try {
      if (row.kind === "pending") {
        await rejectPending.mutateAsync(row.user.uid);
      } else {
        await rejectRequest.mutateAsync(row.request.email);
      }
      setRejecting(null);
    } catch {
      setError(t.pendingRifiutaErrore);
    }
  }

  const roleOptions = roles.map((r) => ({ value: r.id, label: r.name }));

  const columns = useMemo<ReadonlyArray<Column<QueueRow>>>(
    () => [
      {
        id: "email",
        header: t.colEmail,
        accessor: (r) => r.email,
        sortable: true,
      },
      {
        id: "date",
        header: t.colData,
        accessor: (r) => r.date.getTime(),
        sortable: true,
      },
    ],
    []
  );

  const loadError = pending.error || requests.error ? t.loadError : null;
  const acceptingRequest = accepting?.kind === "request" ? accepting.request : null;

  return (
    <>
      {error ? <InlineError className="mb-4">{error}</InlineError> : null}

      <DataGrid<QueueRow>
        rows={rows}
        columns={columns}
        getRowId={(r) => r.emailNorm}
        mode="responsive"
        cardsLayout="list"
        i18n={dataGridIt}
        loading={pending.loading || requests.loading}
        error={loadError}
        rowActions={[]}
        emptyState={<EmptyState title={t.requestsEmpty} />}
        card={(row) => (
          <AccessQueueRow
            row={row}
            roleOptions={roleOptions}
            roleValue={
              row.kind === "pending"
                ? roleByUid[row.user.uid] ?? row.user.roleId
                : ""
            }
            busy={busy}
            onRoleChange={(roleId) => {
              if (row.kind === "pending") {
                setRoleByUid((m) => ({ ...m, [row.user.uid]: roleId }));
              }
            }}
            onAccept={(r) => void handleAccept(r)}
            onReject={(r) => setRejecting(r)}
          />
        )}
      />

      <AcceptAccessRequestDialog
        open={acceptingRequest !== null}
        request={acceptingRequest}
        roles={roles}
        onClose={() => setAccepting(null)}
        onAccepted={() => setAccepting(null)}
      />

      <ConfirmDialog
        open={rejecting !== null}
        title={
          rejecting?.kind === "pending"
            ? t.pendingConfermaRifiutoTitolo
            : t.requestConfirmRejectTitle
        }
        message={
          rejecting?.kind === "pending"
            ? t.pendingConfermaRifiuto
            : t.requestConfirmReject
        }
        confirmLabel={t.requestReject}
        cancelLabel={t.annulla}
        variant="danger"
        busy={busy}
        onConfirm={() => {
          if (rejecting) void handleReject(rejecting);
        }}
        onClose={() => setRejecting(null)}
      />
    </>
  );
}
