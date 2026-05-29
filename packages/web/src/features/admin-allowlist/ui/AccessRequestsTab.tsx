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
import type { AccessRequest } from "@vet/shared";
import {
  useAccessRequests,
  useRejectAccessRequest,
} from "../hooks/useAccessRequests";
import { allowlistI18n as t } from "../i18n";
import { AccessRequestRow } from "./AccessRequestRow";
import { AcceptAccessRequestDialog } from "./AcceptAccessRequestDialog";

interface AccessRequestsTabProps {
  roles: ReadonlyArray<{ id: string; name: string }>;
}

export function AccessRequestsTab({ roles }: AccessRequestsTabProps) {
  const { items, loading, error } = useAccessRequests();
  const reject = useRejectAccessRequest();
  const [accepting, setAccepting] = useState<AccessRequest | null>(null);
  const [rejecting, setRejecting] = useState<AccessRequest | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleReject(): Promise<void> {
    if (!rejecting) return;
    setActionError(null);
    try {
      await reject.mutateAsync(rejecting.email);
      setRejecting(null);
    } catch {
      setActionError(t.requestAcceptError);
    }
  }

  const columns = useMemo<ReadonlyArray<Column<AccessRequest>>>(
    () => [
      {
        id: "email",
        header: t.colEmail,
        accessor: (r) => r.email,
        sortable: true,
      },
      {
        id: "createdAt",
        header: t.colData,
        accessor: (r) => r.firstAttemptAt.getTime(),
        sortable: true,
      },
    ],
    []
  );

  return (
    <>
      {actionError ? (
        <InlineError className="mb-3">{actionError}</InlineError>
      ) : null}

      <DataGrid<AccessRequest>
        rows={items}
        columns={columns}
        getRowId={(r) => r.emailNorm}
        mode="responsive"
        i18n={dataGridIt}
        loading={loading}
        error={error ? t.loadError : null}
        rowActions={[]}
        emptyState={<EmptyState title={t.requestsEmpty} />}
        card={(req) => (
          <AccessRequestRow
            request={req}
            busy={reject.isPending}
            onAccept={(r) => setAccepting(r)}
            onReject={(r) => setRejecting(r)}
          />
        )}
      />

      <AcceptAccessRequestDialog
        open={accepting !== null}
        request={accepting}
        roles={roles}
        onClose={() => setAccepting(null)}
        onAccepted={() => setAccepting(null)}
      />

      <ConfirmDialog
        open={rejecting !== null}
        title={t.requestConfirmRejectTitle}
        message={t.requestConfirmReject}
        confirmLabel={t.requestReject}
        cancelLabel={t.annulla}
        variant="danger"
        busy={reject.isPending}
        onConfirm={() => void handleReject()}
        onClose={() => setRejecting(null)}
      />
    </>
  );
}
