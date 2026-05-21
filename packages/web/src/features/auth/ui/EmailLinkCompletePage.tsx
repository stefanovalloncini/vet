import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { Button, Spinner, TextField } from "../../../shared/ui";
import { useAuthState } from "../hooks/useAuthState";
import {
  useEmailLinkSignIn,
  type EmailLinkSignInState,
} from "../hooks/useEmailLinkSignIn";
import { AuthLayout } from "./AuthLayout";

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
      <AuthLayout eyebrow="Accesso · verifica" title="Conferma l'indirizzo email">
        <p className="text-sm text-(--color-text-muted) mb-6">
          Per sicurezza, ridigita l&apos;indirizzo a cui è stato spedito il link.
        </p>
        <EmailConfirmationForm
          email={email}
          onEmailChange={setEmail}
          onSubmit={handleSubmit}
          submitting={state.kind === "submittingWithEmail"}
          errorMessage={null}
        />
      </AuthLayout>
    );
  }

  if (state.kind === "error") {
    return (
      <AuthLayout eyebrow="Accesso · errore" title="Link non valido">
        <p role="alert" className="text-sm text-(--color-text)">
          {state.message}
        </p>
        <p className="mt-4 text-sm text-(--color-text-muted)">
          Richiedi un nuovo link dalla pagina di accesso.
        </p>
        <div className="mt-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-(--color-accent) underline-offset-4 hover:underline focus:outline-none focus-visible:underline"
          >
            Torna all&apos;accesso
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return <VerifyingState />;
}

function VerifyingState() {
  return (
    <AuthLayout eyebrow="Accesso · verifica" title="Verifica del link in corso">
      <Spinner size={18} label="Verifica del link" />
      <p className="mt-6 text-xs text-(--color-text-subtle)">
        Non chiudere questa scheda. L&apos;app apre la sessione appena la verifica si completa.
      </p>
    </AuthLayout>
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
        fullWidth
        disabled={submitting || email.length === 0}
      >
        {submitting ? "Verifica in corso…" : "Conferma e accedi"}
      </Button>
      {errorMessage ? (
        <p role="alert" className="text-sm text-(--color-danger)">
          {errorMessage}
        </p>
      ) : null}
    </form>
  );
}

export type { EmailLinkSignInState };
