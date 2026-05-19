import { useEffect, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { Brand, Button, Card, Spinner, TextField } from "../../../shared/ui";
import { useAuthState } from "../hooks/useAuthState";
import { getAuthErrorMessage } from "../lib/authErrors";

export function EmailLinkCompletePage() {
  const { auth } = useRepositories();
  const { user } = useAuthState();
  const [error, setError] = useState<string | null>(null);
  const [needsEmail, setNeedsEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    auth.completeEmailSignIn(window.location.href).catch((err) => {
      console.error("email link sign-in failed", err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("email not remembered")) {
        setNeedsEmail(true);
      } else {
        setError(getAuthErrorMessage(err));
      }
    });
  }, [auth]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await auth.completeEmailSignIn(window.location.href, email);
    } catch (err) {
      console.error("email link sign-in failed", err);
      setError(getAuthErrorMessage(err));
      setSubmitting(false);
    }
  }

  if (user) return <Navigate to="/" replace />;

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16 bg-(--color-background)">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Brand size="lg" />
        </div>
        <Card elevated>
          {needsEmail ? (
            <form onSubmit={handleSubmit} className="space-y-5">
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
                onChange={(e) => setEmail(e.target.value)}
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
              {error ? (
                <p role="alert" className="text-sm text-(--color-danger)">
                  {error}
                </p>
              ) : null}
            </form>
          ) : error ? (
            <div className="text-center py-2">
              <p role="alert" className="text-sm text-(--color-danger)">
                {error}
              </p>
            </div>
          ) : (
            <div className="flex justify-center py-2">
              <Spinner size={22} label="Accesso in corso…" />
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
