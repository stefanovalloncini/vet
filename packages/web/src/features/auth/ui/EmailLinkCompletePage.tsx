import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { Brand, Button, Card, Spinner, TextField } from "../../../shared/ui";
import { useAuthState } from "../hooks/useAuthState";
import {
  useEmailLinkSignIn,
  type EmailLinkSignInState,
} from "../hooks/useEmailLinkSignIn";

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

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16 bg-(--color-background)">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Brand size="lg" />
        </div>
        <Card elevated>
          <EmailLinkBody
            state={state}
            email={email}
            onEmailChange={setEmail}
            onSubmit={handleSubmit}
          />
        </Card>
      </div>
    </main>
  );
}

interface EmailLinkBodyProps {
  state: EmailLinkSignInState;
  email: string;
  onEmailChange: (next: string) => void;
  onSubmit: (e: FormEvent) => void;
}

function EmailLinkBody({
  state,
  email,
  onEmailChange,
  onSubmit,
}: EmailLinkBodyProps) {
  if (state.kind === "needsEmail" || state.kind === "submittingWithEmail") {
    return (
      <EmailConfirmationForm
        email={email}
        onEmailChange={onEmailChange}
        onSubmit={onSubmit}
        submitting={state.kind === "submittingWithEmail"}
      />
    );
  }
  if (state.kind === "error") {
    return (
      <div className="text-center py-2">
        <p role="alert" className="text-sm text-(--color-danger)">
          {state.message}
        </p>
      </div>
    );
  }
  return (
    <div className="flex justify-center py-2">
      <Spinner size={22} label="Accesso in corso…" />
    </div>
  );
}

interface EmailConfirmationFormProps {
  email: string;
  onEmailChange: (next: string) => void;
  onSubmit: (e: FormEvent) => void;
  submitting: boolean;
}

function EmailConfirmationForm({
  email,
  onEmailChange,
  onSubmit,
  submitting,
}: EmailConfirmationFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <h1 className="text-base font-medium text-(--color-text)">
          Conferma la tua email
        </h1>
        <p className="text-sm text-(--color-text-muted) mt-1">
          Inserisci l&apos;email a cui è stato inviato il link.
        </p>
      </div>
      <TextField
        id="confirm-email"
        type="email"
        label="Email"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        required
        autoFocus
        disabled={submitting}
        placeholder="tua.email@studio.it"
      />
      <Button
        type="submit"
        variant="primary"
        fullWidth
        disabled={submitting || email.length === 0}
      >
        {submitting ? "Accesso..." : "Conferma"}
      </Button>
    </form>
  );
}
