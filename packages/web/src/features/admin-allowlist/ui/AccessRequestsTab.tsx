import { useState } from "react";
import {
  BoxedList,
  ConfirmDialog,
  EmptyState,
  InlineError,
  LoadingHint,
} from "../../../shared/ui";
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

  if (loading) return <LoadingHint label={t.loading} />;
  if (error) return <InlineError>{t.loadError}</InlineError>;

  return (
    <>
      {actionError ? (
        <InlineError className="mb-3">{actionError}</InlineError>
      ) : null}

      {items.length === 0 ? (
        <EmptyState title={t.requestsEmpty} />
      ) : (
        <BoxedList>
          {items.map((req) => (
            <AccessRequestRow
              key={req.emailNorm}
              request={req}
              busy={reject.isPending}
              onAccept={(r) => setAccepting(r)}
              onReject={(r) => setRejecting(r)}
            />
          ))}
        </BoxedList>
      )}

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
