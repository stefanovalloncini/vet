import type { FormEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { Button, TextField } from "../../../shared/ui";

interface EmailLinkFormProps {
  email: string;
  busy: boolean;
  onEmailChange: (next: string) => void;
  onSubmit: (e: FormEvent) => void;
  onBack: () => void;
}

export function EmailLinkForm({
  email,
  busy,
  onEmailChange,
  onSubmit,
  onBack,
}: EmailLinkFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <TextField
        id="email"
        label="Email"
        type="email"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        required
        autoFocus
        disabled={busy}
        placeholder="nome.cognome@studio.it"
        hint="Ti arriva un link a tempo. Apri dallo stesso dispositivo."
      />
      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        disabled={busy || email.length === 0}
      >
        {busy ? "Invio in corso…" : "Inviami il link"}
      </Button>
      <button
        type="button"
        onClick={onBack}
        disabled={busy}
        className="inline-flex items-center gap-1.5 text-sm text-(--color-text-muted) hover:text-(--color-text) disabled:opacity-50 focus:outline-none focus-visible:underline underline-offset-4"
      >
        <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
        Indietro
      </button>
    </form>
  );
}
