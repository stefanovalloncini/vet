import type { AccessRequest } from "@vet/shared";
import { Button } from "../../../shared/ui";
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
    <li className="px-4 py-3 flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-(--color-text) truncate">
          {request.email}
        </p>
        {request.displayName ? (
          <p className="text-xs text-(--color-text-muted) mt-0.5 truncate">
            {request.displayName}
          </p>
        ) : null}
        <p className="text-xs text-(--color-text-subtle) mt-1.5">
          {meta.join(" · ")}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => onAccept(request)}
          disabled={busy}
        >
          + {t.requestAccept}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onReject(request)}
          disabled={busy}
        >
          {t.requestReject}
        </Button>
      </div>
    </li>
  );
}
