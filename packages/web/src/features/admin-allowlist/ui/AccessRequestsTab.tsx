import { useState } from "react";
import { httpsCallable, getFunctions } from "firebase/functions";
import {
  BoxedList,
  ConfirmDialog,
  EmptyState,
  InlineError,
  LoadingHint,
} from "../../../shared/ui";
import type { AccessRequest } from "@vet/shared";
import { useAccessRequests } from "../hooks/useAccessRequests";
import { allowlistI18n as t } from "../i18n";
import { AccessRequestRow } from "./AccessRequestRow";
import { AcceptAccessRequestDialog } from "./AcceptAccessRequestDialog";

interface AccessRequestsTabProps {
  roles: ReadonlyArray<{ id: string; name: string }>;
}

export function AccessRequestsTab({ roles }: AccessRequestsTabProps) {
  const { items, loading, error, refresh } = useAccessRequests();
  const [accepting, setAccepting] = useState<AccessRequest | null>(null);
  const [rejecting, setRejecting] = useState<AccessRequest | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleReject(): Promise<void> {
    if (!rejecting) return;
    setBusy(true);
    setActionError(null);
    try {
      const fn = httpsCallable(
        getFunctions(undefined, "europe-west8"),
        "rejectAccessRequest"
      );
      await fn({ email: rejecting.email });
      setRejecting(null);
      await refresh();
    } catch {
      setActionError(t.requestAcceptError);
    } finally {
      setBusy(false);
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
              busy={busy}
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
        onAccepted={async () => {
          setAccepting(null);
          await refresh();
        }}
      />

      <ConfirmDialog
        open={rejecting !== null}
        title={t.requestConfirmRejectTitle}
        message={t.requestConfirmReject}
        confirmLabel={t.requestReject}
        cancelLabel={t.annulla}
        variant="danger"
        busy={busy}
        onConfirm={() => void handleReject()}
        onClose={() => setRejecting(null)}
      />
    </>
  );
}
