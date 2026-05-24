import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Loader2, Mail } from "lucide-react";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { Button, GoogleIcon, LoadingHint } from "../../../shared/ui";
import { useAuthState } from "../hooks/useAuthState";
import {
  classifyAuthError,
  type ClassifiedAuthError,
} from "../lib/authErrors";
import { AuthLayout } from "./AuthLayout";
import { EmailLinkForm, type EmailFormValues } from "./EmailLinkForm";
import { EmailLinkSent } from "./EmailLinkSent";

type View = "choice" | "email" | "sent";

const TITLES: Record<View, string> = {
  choice: "Entra nel tuo account",
  email: "Entra con email",
  sent: "Controlla la posta",
};

export function LoginPage() {
  const { auth } = useRepositories();
  const { loading, user } = useAuthState();
  const [view, setView] = useState<View>("choice");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<ClassifiedAuthError | null>(null);
  const [busy, setBusy] = useState(false);

  async function googleSignIn(selectAccount = false) {
    setError(null);
    setBusy(true);
    try {
      await auth.signInWithGoogle({ selectAccount });
    } catch (err) {
      console.error("google sign-in failed", err);
      const classified = classifyAuthError(err);
      if (classified.kind !== "userCancelled") setError(classified);
    } finally {
      setBusy(false);
    }
  }

  async function handleEmailSubmit(values: EmailFormValues) {
    setError(null);
    setBusy(true);
    try {
      await auth.sendEmailSignInLink(values.email);
      setEmail(values.email);
      setView("sent");
    } catch (err) {
      console.error("send email link failed", err);
      setError(classifyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  function goToEmail() {
    setError(null);
    setView("email");
  }

  function goToChoice() {
    setError(null);
    setView("choice");
  }

  if (loading) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center bg-(--color-background)">
        <LoadingHint />
      </main>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <AuthLayout
      eyebrow="Accesso"
      title={TITLES[view]}
      footer={
        <p>
          L&apos;ingresso è riservato alle persone nell&apos;elenco abilitato dallo studio.
        </p>
      }
    >
      {error ? <AuthErrorBanner error={error} busy={busy} onRetryGoogle={() => googleSignIn(true)} /> : null}

      {view === "choice" ? (
        <div className="space-y-3">
          <Button
            type="button"
            variant="primary"
            size="lg"
            fullWidth
            disabled={busy}
            onClick={() => googleSignIn(false)}
            leadingIcon={
              busy ? (
                <Loader2 size={20} strokeWidth={2} className="animate-spin" aria-hidden="true" />
              ) : (
                <GoogleIcon />
              )
            }
          >
            {busy ? "Accesso in corso…" : "Entra con Google"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            fullWidth
            disabled={busy}
            onClick={goToEmail}
            leadingIcon={<Mail size={18} strokeWidth={2} aria-hidden="true" />}
          >
            Entra con email
          </Button>
        </div>
      ) : null}

      {view === "email" ? (
        <EmailLinkForm
          defaultEmail={email}
          busy={busy}
          onSubmit={handleEmailSubmit}
          onBack={goToChoice}
          onEmailChange={setEmail}
        />
      ) : null}

      {view === "sent" ? <EmailLinkSent email={email} /> : null}
    </AuthLayout>
  );
}

interface AuthErrorBannerProps {
  error: ClassifiedAuthError;
  busy: boolean;
  onRetryGoogle: () => void;
}

function AuthErrorBanner({ error, busy, onRetryGoogle }: AuthErrorBannerProps) {
  return (
    <div
      className="mb-6 rounded-lg border border-(--color-danger)/40 bg-(--color-danger)/5 p-3 space-y-2"
      role="alert"
    >
      <p className="text-sm text-(--color-danger)">{error.message}</p>
      {error.kind === "unauthorizedEmail" ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={busy}
          onClick={onRetryGoogle}
        >
          Cambia account Google
        </Button>
      ) : null}
      {error.kind === "appCheckFailed" || error.kind === "storageBlocked" ? (
        <Link
          to="/sicurezza"
          className="inline-flex items-center text-xs font-medium text-(--color-accent) underline-offset-4 hover:underline focus:outline-none focus-visible:underline"
        >
          Esegui la verifica di sicurezza
        </Link>
      ) : null}
    </div>
  );
}
