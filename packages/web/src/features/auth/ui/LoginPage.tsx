import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { Button, GoogleIcon, TextField } from "../../../shared/ui";
import { useAuthState } from "../hooks/useAuthState";
import {
  classifyAuthError,
  type ClassifiedAuthError,
} from "../lib/authErrors";
import { AuthLayout } from "./AuthLayout";

export function LoginPage() {
  const { auth } = useRepositories();
  const { loading, user } = useAuthState();
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
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

  async function handleEmail(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await auth.sendEmailSignInLink(email);
      setEmailSent(true);
    } catch (err) {
      console.error("send email link failed", err);
      setError(classifyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-(--color-background)">
        <p className="text-sm text-(--color-text-muted)">Caricamento…</p>
      </main>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <AuthLayout
      eyebrow="Accesso"
      title="Entra con il tuo account"
      footer={
        <p>
          L&apos;ingresso è riservato alle persone nell&apos;elenco abilitato dallo studio.
        </p>
      }
    >
      <Button
        type="button"
        variant="primary"
        fullWidth
        disabled={busy}
        onClick={() => googleSignIn(false)}
        leadingIcon={<GoogleIcon />}
      >
        Entra con Google
      </Button>

      {emailSent ? (
        <p className="mt-6 text-sm text-(--color-text)" role="status">
          Link inviato a{" "}
          <span className="font-mono text-(--color-text)">{email}</span>.
          Aprilo dallo stesso dispositivo per completare l&apos;accesso.
        </p>
      ) : showEmail ? (
        <form onSubmit={handleEmail} className="mt-8 space-y-4">
          <TextField
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            disabled={busy}
            placeholder="nome.cognome@studio.it"
            hint="Ti arriva un link a tempo. Apri dallo stesso dispositivo."
          />
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => setShowEmail(false)}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={busy || email.length === 0}
            >
              Inviami il link
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-6 flex items-center gap-3 text-sm text-(--color-text-muted)">
          <span>Niente Google?</span>
          <button
            type="button"
            onClick={() => setShowEmail(true)}
            disabled={busy}
            className="font-medium text-(--color-accent) underline-offset-4 hover:underline focus:outline-none focus-visible:underline disabled:opacity-50"
          >
            Ricevi un link via email
          </button>
        </div>
      )}

      {error ? (
        <div className="mt-6 border-t border-(--color-border) pt-4 space-y-3" role="alert">
          <p className="text-sm text-(--color-danger)">{error.message}</p>
          {error.kind === "unauthorizedEmail" ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={() => googleSignIn(true)}
            >
              Cambia account Google
            </Button>
          ) : null}
        </div>
      ) : null}
    </AuthLayout>
  );
}
