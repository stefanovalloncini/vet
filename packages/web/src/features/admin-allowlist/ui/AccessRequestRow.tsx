import type { AccessRequest } from "@vet/shared";
import { Check, X } from "lucide-react";
import { Badge, Button } from "../../../shared/ui";
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
    `${t.requestFirstSeen} ${request.firstAttemptAt.toLocaleDateString("it-IT")}`,
    `${t.requestLastSeen} ${request.lastAttemptAt.toLocaleDateString("it-IT")}`,
    provider,
  ].filter(Boolean) as string[];

  return (
    <li className="px-4 py-2.5 grid grid-cols-[1fr_auto] items-center gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto] sm:gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-sm font-mono text-(--color-text) truncate">
            {request.email}
          </p>
          <Badge tone="danger" aria-label={t.statoRichiesta}>
            {t.statoRichiesta}
          </Badge>
        </div>
        {request.displayName ? (
          <p className="text-xs text-(--color-text-muted) mt-0.5 truncate">
            {request.displayName}
          </p>
        ) : null}
      </div>
      <p className="hidden sm:block text-xs text-(--color-text-muted) truncate">
        {meta.join(" · ")}
      </p>
      <div className="flex items-center gap-1 justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onAccept(request)}
          disabled={busy}
          aria-label={t.requestAccept}
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
          aria-label={t.requestReject}
          leadingIcon={<X size={14} strokeWidth={1.75} aria-hidden="true" />}
        >
          <span className="hidden md:inline">{t.requestReject}</span>
        </Button>
      </div>
    </li>
  );
}
