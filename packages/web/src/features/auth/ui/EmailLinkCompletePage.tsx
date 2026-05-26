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
          <p role="alert" className="text-sm text-(--color-text)">
            {state.message}
          </p>
          <p className="text-sm text-(--color-text-muted)">
            Richiedi un nuovo link dalla pagina di accesso.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-(--color-accent) underline-offset-4 hover:underline focus:outline-none focus-visible:underline"
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
