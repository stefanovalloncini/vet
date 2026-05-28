interface AccessRequestSentProps {
  email: string;
}

export function AccessRequestSent({ email }: AccessRequestSentProps) {
  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <p className="text-sm text-(--color-text)">
        Richiesta inviata per{" "}
        <span className="font-mono break-all text-(--color-text)">{email}</span>
        .
      </p>
      <p className="text-sm text-(--color-text-muted)">
        Lo studio è stato notificato. Riceverai un&apos;email quando
        l&apos;account viene approvato.
      </p>
    </div>
  );
}
