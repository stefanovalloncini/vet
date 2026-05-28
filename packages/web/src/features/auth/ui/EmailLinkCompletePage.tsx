import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { Button, InlineError, TextField } from "../../../shared/ui";
import { useAuthState } from "../hooks/useAuthState";
import {
  useEmailLinkSignIn,
  type EmailLinkSignInState,
} from "../hooks/useEmailLinkSignIn";
import { CenteredAuthLayout } from "./CenteredAuthLayout";
import { SlowAuthLoading, type SlowAuthStage } from "./SlowAuthLoading";

const VERIFICATION_STAGES: readonly SlowAuthStage[] = [
  { atMs: 0, label: "Verifica del link…" },
  { atMs: 3000, label: "Controllo dell'autorizzazione…" },
  { atMs: 7000, label: "Apertura della sessione…" },
];

export function EmailLinkCompletePage() {
  const { auth } = useRepositories();
  const { user } = useAuthState();
  const { state, submitWithEmail } = useEmailLinkSignIn(
    auth,
    window.location.href
  );
  const [email, setEmail] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await submitWithEmail(email);
  }

  if (user) return <Navigate to="/" replace />;

  if (state.kind === "needsEmail" || state.kind === "submittingWithEmail") {
    return (
      <CenteredAuthLayout
        title="Conferma l'indirizzo email"
        subtitle="Per sicurezza, ridigita l'indirizzo a cui è stato spedito il link."
      >
        <EmailConfirmationForm
          email={email}
          onEmailChange={setEmail}
          onSubmit={handleSubmit}
          submitting={state.kind === "submittingWithEmail"}
          errorMessage={null}
        />
      </CenteredAuthLayout>
    );
  }

  if (state.kind === "error") {
    return (
      <CenteredAuthLayout title="Link non valido">
        <div className="space-y-6">
          <div
            role="alert"
            className="rounded-lg border border-(--color-danger)/40 bg-(--color-danger)/5 p-3"
          >
            <p className="text-sm text-(--color-danger)">{state.message}</p>
          </div>
          <p className="text-sm text-(--color-text-muted)">
            Richiedi un nuovo link dalla pagina di accesso.
          </p>
          <Link
            to="/login"
            className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-(--color-accent) px-5 text-base font-medium text-white hover:bg-(--color-accent-hover) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-2 transition-colors duration-(--motion-fast) ease-(--ease-out-quart) active:scale-[0.97] active:duration-(--motion-press)"
          >
            Torna all&apos;accesso
          </Link>
        </div>
      </CenteredAuthLayout>
    );
  }

  return <VerifyingState />;
}

function VerifyingState() {
  return (
    <CenteredAuthLayout title="Accesso in corso">
      <div className="space-y-6">
        <SlowAuthLoading stages={VERIFICATION_STAGES} />
        <p className="text-xs text-center text-(--color-text-subtle)">
          Non chiudere questa scheda. L&apos;app apre la sessione appena la
          verifica si completa.
        </p>
      </div>
    </CenteredAuthLayout>
  );
}

interface EmailConfirmationFormProps {
  email: string;
  onEmailChange: (next: string) => void;
  onSubmit: (e: FormEvent) => void;
  submitting: boolean;
  errorMessage: string | null;
}

function EmailConfirmationForm({
  email,
  onEmailChange,
  onSubmit,
  submitting,
  errorMessage,
}: EmailConfirmationFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <TextField
        id="confirm-email"
        type="email"
        label="Email"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        required
        autoFocus
        disabled={submitting}
        placeholder="nome.cognome@studio.it"
      />
      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        disabled={submitting || email.length === 0}
      >
        {submitting ? "Verifica in corso…" : "Conferma e accedi"}
      </Button>
      {errorMessage ? <InlineError>{errorMessage}</InlineError> : null}
    </form>
  );
}

export type { EmailLinkSignInState };
