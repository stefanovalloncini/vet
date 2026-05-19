import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import {
  Brand,
  Button,
  Card,
  Divider,
  GoogleIcon,
  TextField,
} from "../../../shared/ui";
import { useAuthState } from "../hooks/useAuthState";
import { getAuthErrorMessage, isUserCancelledPopup } from "../lib/authErrors";

export function LoginPage() {
  const { auth } = useRepositories();
  const { loading, user } = useAuthState();
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleGoogle() {
    setError(null);
    setBusy(true);
    try {
      await auth.signInWithGoogle();
    } catch (err) {
      console.error("google sign-in failed", err);
      if (!isUserCancelledPopup(err)) setError(getAuthErrorMessage(err));
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
      setError("Invio link non riuscito.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-(--color-background)">
        <p className="text-sm text-(--color-text-muted)">Caricamento...</p>
      </main>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16 bg-(--color-background)">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-10">
          <Brand size="lg" className="mb-8" />
          <h1 className="text-3xl text-(--color-text)">
            Accedi al gestionale
          </h1>
        </div>

        <Card elevated>
          <Button
            type="button"
            variant="secondary"
            fullWidth
            disabled={busy}
            onClick={handleGoogle}
            leadingIcon={<GoogleIcon />}
          >
            Continua con Google
          </Button>

          <Divider className="my-6">oppure</Divider>

          {emailSent ? (
            <div className="rounded-xl bg-(--color-accent-soft) border border-(--color-accent)/20 p-4 text-sm text-(--color-text)">
              Controlla la tua email. Ti abbiamo inviato un link per accedere.
            </div>
          ) : (
            <form onSubmit={handleEmail} className="space-y-4">
              <TextField
                id="email"
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={busy}
                placeholder="tua.email@studio.it"
              />
              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={busy || email.length === 0}
              >
                Inviami il link
              </Button>
            </form>
          )}

          {error ? (
            <p role="alert" className="mt-4 text-sm text-(--color-danger)">
              {error}
            </p>
          ) : null}
        </Card>

        <p className="text-center text-xs text-(--color-text-subtle) mt-8">
          Solo email autorizzate possono accedere.
        </p>
      </div>
    </main>
  );
}
