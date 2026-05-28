import { useEffect, useState } from "react";
import { MailCheck } from "lucide-react";
import { Button, Card } from "../../../shared/ui";

const RESEND_COOLDOWN_SEC = 30;

interface EmailLinkSentProps {
  email: string;
  busy: boolean;
  onResend: () => Promise<void> | void;
}

export function EmailLinkSent({ email, busy, onResend }: EmailLinkSentProps) {
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SEC);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const id = window.setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  async function handleResend() {
    if (cooldown > 0 || busy) return;
    setCooldown(RESEND_COOLDOWN_SEC);
    await onResend();
  }

  const canResend = cooldown <= 0 && !busy;

  return (
    <div role="status" aria-live="polite" className="space-y-6">
      <Card padding="md" className="border-(--color-accent-soft)">
        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--color-accent-soft) text-(--color-accent)"
            aria-hidden="true"
          >
            <MailCheck size={18} strokeWidth={1.75} />
          </span>
          <div className="min-w-0 space-y-1.5">
            <p className="text-sm font-medium text-(--color-text)">
              Controlla la tua email
            </p>
            <p className="text-sm text-(--color-text-muted)">
              Link inviato a{" "}
              <span className="font-mono break-all text-(--color-text)">
                {email}
              </span>
              . Apri dallo stesso dispositivo per completare l&apos;accesso.
            </p>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!canResend}
          onClick={() => void handleResend()}
        >
          {busy ? "Invio in corso…" : "Invia di nuovo"}
        </Button>
        {cooldown > 0 ? (
          <span className="text-xs tabular-nums text-(--color-text-subtle)">
            tra {cooldown}s
          </span>
        ) : null}
      </div>
    </div>
  );
}
