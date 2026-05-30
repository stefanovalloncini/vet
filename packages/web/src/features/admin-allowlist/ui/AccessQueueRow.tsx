import { Check, X } from "lucide-react";
import { Badge, Button, Select } from "../../../shared/ui";
import { formatDate } from "../../../shared/lib/format";
import { allowlistI18n as t } from "../i18n";
import type { AccessQueueRow as QueueRow } from "../lib/mergeAccessQueue";

interface AccessQueueRowProps {
  row: QueueRow;
  roleOptions: ReadonlyArray<{ value: string; label: string }>;
  roleValue: string;
  busy: boolean;
  onRoleChange: (roleId: string) => void;
  onAccept: (row: QueueRow) => void;
  onReject: (row: QueueRow) => void;
}

function providerLabel(providerId: string | undefined): string | null {
  if (!providerId) return null;
  if (providerId === "google.com") return t.requestProviderGoogle;
  if (providerId === "emailLink") return t.requestProviderEmailLink;
  if (providerId === "password") return t.requestProviderPassword;
  return null;
}

function pendingMeta(displayName: string, createdAt: Date): string {
  return `${displayName} · ${t.pendingSignedUpAt} ${formatDate(createdAt)}`;
}

function requestMeta(
  displayName: string | undefined,
  attempts: number,
  firstAttemptAt: Date,
  lastAttemptAt: Date,
  providerId: string | undefined
): string {
  return [
    displayName,
    t.requestAttempts(attempts),
    `${t.requestFirstSeen} ${formatDate(firstAttemptAt)}`,
    `${t.requestLastSeen} ${formatDate(lastAttemptAt)}`,
    providerLabel(providerId),
  ]
    .filter((x): x is string => Boolean(x))
    .join(" · ");
}

export function AccessQueueRow({
  row,
  roleOptions,
  roleValue,
  busy,
  onRoleChange,
  onAccept,
  onReject,
}: AccessQueueRowProps) {
  const isPending = row.kind === "pending";
  const meta = isPending
    ? pendingMeta(row.user.displayName, row.user.createdAt)
    : requestMeta(
        row.request.displayName,
        row.request.attempts,
        row.request.firstAttemptAt,
        row.request.lastAttemptAt,
        row.request.providerId
      );

  return (
    <div className="sm:col-span-2 lg:col-span-3 bg-(--color-surface) border border-(--color-border) rounded-xl sm:rounded-2xl px-4 py-3 flex flex-col gap-3 md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,14rem)_auto] md:gap-4 md:items-end">
      <div className="min-w-0 md:pb-1.5">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <p className="text-sm font-mono text-(--color-text) break-all min-w-0">
            {row.email}
          </p>
          <Badge tone={isPending ? "warning" : "danger"}>
            {isPending ? t.statoDaConfermare : t.statoNonInAllowlist}
          </Badge>
        </div>
        <p className="text-xs text-(--color-text-muted) mt-0.5 md:truncate tabular-nums">
          {meta}
        </p>
      </div>

      {isPending ? (
        <Select
          id={`role-${row.user.uid}`}
          label={t.pendingRuolo}
          value={roleValue}
          onChange={(e) => onRoleChange(e.target.value)}
          options={roleOptions}
          disabled={busy}
        />
      ) : (
        <div className="hidden md:block" aria-hidden="true" />
      )}

      <div className="flex items-center gap-1 justify-end shrink-0 md:pb-1.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onAccept(row)}
          disabled={busy}
          aria-label={`${isPending ? t.pendingApprova : t.requestAccept} ${row.email}`}
          leadingIcon={<Check size={14} strokeWidth={1.75} aria-hidden="true" />}
        >
          <span className="hidden md:inline">
            {isPending ? t.pendingApprova : t.requestAccept}
          </span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onReject(row)}
          disabled={busy}
          aria-label={`${t.requestReject} ${row.email}`}
          leadingIcon={<X size={14} strokeWidth={1.75} aria-hidden="true" />}
        >
          <span className="hidden md:inline">{t.requestReject}</span>
        </Button>
      </div>
    </div>
  );
}
