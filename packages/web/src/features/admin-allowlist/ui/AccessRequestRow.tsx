import type { AccessRequest } from "@vet/shared";
import { Check, X } from "lucide-react";
import { Badge, Button } from "../../../shared/ui";
import { formatDate } from "../../../shared/lib/format";
import { allowlistI18n as t } from "../i18n";

interface AccessRequestRowProps {
  request: AccessRequest;
  busy: boolean;
  onAccept: (req: AccessRequest) => void;
  onReject: (req: AccessRequest) => void;
}

function providerLabel(providerId: string | undefined): string | null {
  if (!providerId) return null;
  if (providerId === "google.com") return t.requestProviderGoogle;
  if (providerId === "emailLink") return t.requestProviderEmailLink;
  if (providerId === "password") return t.requestProviderPassword;
  return null;
}

export function AccessRequestRow({
  request,
  busy,
  onAccept,
  onReject,
}: AccessRequestRowProps) {
  const provider = providerLabel(request.providerId);
  const meta = [
    t.requestAttempts(request.attempts),
    `${t.requestFirstSeen} ${formatDate(request.firstAttemptAt)}`,
    `${t.requestLastSeen} ${formatDate(request.lastAttemptAt)}`,
    provider,
  ].filter((x): x is string => Boolean(x));

  return (
    <div className="sm:col-span-2 lg:col-span-3 bg-(--color-surface) border border-(--color-border) rounded-xl sm:rounded-2xl px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2 md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_auto] md:items-center">
      <div className="min-w-0 basis-full md:basis-auto">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <p className="text-sm font-mono text-(--color-text) break-all min-w-0">
            {request.email}
          </p>
          <Badge tone="danger">{t.statoRichiesta}</Badge>
        </div>
        {request.displayName ? (
          <p className="text-xs text-(--color-text-muted) mt-0.5 truncate">
            {request.displayName}
          </p>
        ) : null}
      </div>
      <p className="min-w-0 basis-full md:basis-auto text-xs text-(--color-text-muted) md:truncate tabular-nums">
        {meta.join(" · ")}
      </p>
      <div className="ml-auto md:ml-0 flex items-center gap-1 justify-end shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onAccept(request)}
          disabled={busy}
          aria-label={`${t.requestAccept} ${request.email}`}
          leadingIcon={<Check size={14} strokeWidth={1.75} aria-hidden="true" />}
        >
          <span className="hidden md:inline">{t.requestAccept}</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onReject(request)}
          disabled={busy}
          aria-label={`${t.requestReject} ${request.email}`}
          leadingIcon={<X size={14} strokeWidth={1.75} aria-hidden="true" />}
        >
          <span className="hidden md:inline">{t.requestReject}</span>
        </Button>
      </div>
    </div>
  );
}
