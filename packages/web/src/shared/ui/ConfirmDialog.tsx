import type { ReactNode } from "react";
import { Button } from "./Button";
import { Dialog } from "./Dialog";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Conferma",
  cancelLabel = "Annulla",
  variant = "danger",
  busy = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} labelledBy="confirm-dialog-title" size="sm">
      <div className="p-5 space-y-4">
        <div>
          <h2 id="confirm-dialog-title" className="text-base font-medium text-(--color-text)">
            {title}
          </h2>
          {message ? (
            <div className="text-sm text-(--color-text-muted) mt-2">{message}</div>
          ) : null}
        </div>
        <div className="flex items-center justify-end gap-3 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button type="button" variant={variant} onClick={onConfirm} disabled={busy}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
