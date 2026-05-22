import { useState, type FormEvent } from "react";
import {
  Button,
  Dialog,
  InlineError,
  Select,
} from "../../../shared/ui";
import type { AccessRequest } from "@vet/shared";
import { allowlistI18n as t } from "../i18n";
import { useAcceptAccessRequest } from "../hooks/useAccessRequests";

interface AcceptAccessRequestDialogProps {
  open: boolean;
  request: AccessRequest | null;
  roles: ReadonlyArray<{ id: string; name: string }>;
  onClose: () => void;
  onAccepted: () => void;
}

export function AcceptAccessRequestDialog({
  open,
  request,
  roles,
  onClose,
  onAccepted,
}: AcceptAccessRequestDialogProps) {
  const accept = useAcceptAccessRequest();
  const [roleId, setRoleId] = useState("vet");
  const [error, setError] = useState<string | null>(null);

  const busy = accept.isPending;

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!request) return;
    setError(null);
    try {
      await accept.mutateAsync({ email: request.email, roleId });
      onAccepted();
      setRoleId("vet");
      onClose();
    } catch {
      setError(t.requestAcceptError);
    }
  }

  function handleClose(): void {
    if (busy) return;
    setError(null);
    setRoleId("vet");
    onClose();
  }

  const roleOptions = roles.map((r) => ({ value: r.id, label: r.name }));

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      labelledBy="accept-request-title"
      size="sm"
    >
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div>
          <h2
            id="accept-request-title"
            className="text-base font-medium text-(--color-text)"
          >
            {t.requestAcceptDialogTitle}
          </h2>
          <p className="text-xs text-(--color-text-muted) mt-1">
            {t.requestAcceptDialogDescr}
          </p>
        </div>
        <div className="text-sm">
          <p className="text-(--color-text-muted) text-xs uppercase tracking-wider">
            Email
          </p>
          <p className="text-(--color-text) mt-1 font-mono">
            {request?.email ?? ""}
          </p>
        </div>
        <Select
          id="accept-role"
          label={t.campoRuolo}
          value={roleId}
          options={roleOptions}
          onChange={(e) => setRoleId(e.target.value)}
          disabled={busy}
        />
        {error ? <InlineError>{error}</InlineError> : null}
        <div className="flex items-center justify-end gap-3 pt-1">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={busy}
          >
            {t.annulla}
          </Button>
          <Button type="submit" variant="primary" disabled={busy}>
            {t.requestAccept}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
