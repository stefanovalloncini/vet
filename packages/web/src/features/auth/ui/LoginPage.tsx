import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { Button, GoogleIcon } from "../../../shared/ui";
import { useAuthState } from "../hooks/useAuthState";
import {
  classifyAuthError,
  type ClassifiedAuthError,
} from "../lib/authErrors";
import { CenteredAuthLayout } from "./CenteredAuthLayout";
import { EmailLinkForm, type EmailFormValues } from "./EmailLinkForm";
import { EmailLinkSent } from "./EmailLinkSent";
import { AccessRequestForm, type AccessRequestFormValues } from "./AccessRequestForm";
import { AccessRequestSent } from "./AccessRequestSent";
import { SlowAuthLoading } from "./SlowAuthLoading";
import { GoogleSignInHint } from "./GoogleSignInHint";

type View = "signIn" | "linkSent" | "requestAccess" | "requestSent";

const TITLES: Record<View, string> = {
  signIn: "Entra nel tuo account",
  linkSent: "Controlla la posta",
  requestAccess: "Richiedi accesso",
  requestSent: "Richiesta ricevuta",
};

const SUBTITLES: Partial<Record<View, string>> = {
  requestAccess:
    "Compila il modulo. L'amministratore approva l'account a mano.",
};

export function LoginPage() {
  const { auth } = useRepositories();
  const { loading, user } = useAuthState();
  const [view, setView] = useState<View>("signIn");
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

  async function sendLink(target: string, nextView: "linkSent" | "requestSent") {
    setError(null);
    setBusy(true);
    try {
      await auth.sendEmailSignInLink(target);
      setEmail(target);
      setView(nextView);
    } catch (err) {
      console.error("send email link failed", err);
      setError(classifyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  function handleEmailSubmit(values: EmailFormValues) {
    return sendLink(values.email, "linkSent");
  }

  function handleResend() {
    return sendLink(email, "linkSent");
  }

  function handleAccessRequestSubmit(values: AccessRequestFormValues) {
    return sendLink(values.email, "requestSent");
  }

  if (loading) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center bg-(--color-background) p-6">
        <SlowAuthLoading label="Verifica della sessione…" />
      </main>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <CenteredAuthLayout
      title={TITLES[view]}
      subtitle={SUBTITLES[view]}
      footer={
        <span>
          Ingresso riservato all&apos;elenco abilitato dallo studio.{" "}
          <Link
            to="/privacy"
            className="underline-offset-4 hover:underline focus:outline-none focus-visible:underline"
          >
            Informativa privacy
          </Link>
          .
        </span>
      }
    >
      {error ? (
        <AuthErrorBanner
          error={error}
          busy={busy}
          onRetryGoogle={() => googleSignIn(true)}
        />
      ) : null}

      {view === "signIn" ? (
        <SignInView
          email={email}
          busy={busy}
          onEmailChange={setEmail}
          onEmailSubmit={handleEmailSubmit}
          onGoogle={() => googleSignIn(false)}
          onRetryGoogle={() => googleSignIn(true)}
          onRequestAccess={() => {
            setError(null);
            setView("requestAccess");
          }}
        />
      ) : null}

      {view === "linkSent" ? (
        <EmailLinkSent
          email={email}
          busy={busy}
          onResend={handleResend}
        />
      ) : null}

      {view === "requestAccess" ? (
        <AccessRequestForm
          busy={busy}
          onSubmit={handleAccessRequestSubmit}
          onBack={() => {
            setError(null);
            setView("signIn");
          }}
        />
      ) : null}

      {view === "requestSent" ? <AccessRequestSent email={email} /> : null}
    </CenteredAuthLayout>
  );
}

interface SignInViewProps {
  email: string;
  busy: boolean;
  onEmailChange: (next: string) => void;
  onEmailSubmit: (values: EmailFormValues) => Promise<void>;
  onGoogle: () => void;
  onRetryGoogle: () => void;
  onRequestAccess: () => void;
}

function SignInView({
  email,
  busy,
  onEmailChange,
  onEmailSubmit,
  onGoogle,
  onRetryGoogle,
  onRequestAccess,
}: SignInViewProps) {
  return (
    <div className="space-y-6">
      <EmailLinkForm
        defaultEmail={email}
        busy={busy}
        onSubmit={onEmailSubmit}
        onEmailChange={onEmailChange}
      />

      <div className="relative">
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-1/2 h-px bg-(--color-border)"
        />
        <span className="relative mx-auto block w-fit bg-(--color-background) px-3 text-[11px] uppercase tracking-[0.18em] text-(--color-text-subtle)">
          oppure
        </span>
      </div>

      <div className="space-y-3">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          fullWidth
          disabled={busy}
          onClick={onGoogle}
          leadingIcon={
            busy ? (
              <Loader2
                size={18}
                strokeWidth={2}
                className="animate-spin"
                aria-hidden="true"
              />
            ) : (
              <GoogleIcon />
            )
          }
        >
          Entra con Google
        </Button>
        <GoogleSignInHint busy={busy} onRetry={onRetryGoogle} />
      </div>

      <p className="text-center text-sm text-(--color-text-muted)">
        Non hai un account?{" "}
        <button
          type="button"
          onClick={onRequestAccess}
          disabled={busy}
          className="text-(--color-accent) underline-offset-4 hover:underline focus:outline-none focus-visible:underline disabled:opacity-50"
        >
          Richiedi accesso
        </button>
      </p>
    </div>
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
