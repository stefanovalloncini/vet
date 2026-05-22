interface EmailLinkSentProps {
  email: string;
}

export function EmailLinkSent({ email }: EmailLinkSentProps) {
  return (
    <div role="status" className="space-y-2">
      <p className="text-sm text-(--color-text)">
        Link inviato a{" "}
        <span className="font-mono text-(--color-text)">{email}</span>.
      </p>
      <p className="text-sm text-(--color-text-muted)">
        Apri il link dallo stesso dispositivo per completare l&apos;accesso.
      </p>
    </div>
  );
}
