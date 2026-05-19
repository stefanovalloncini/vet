import { useEffect, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
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

  if (needsEmail) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-16">
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          <p className="text-sm">Conferma la tua email per completare l'accesso:</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={submitting}
            placeholder="tua.email@studio.it"
            className="w-full border rounded p-2"
          />
          <button type="submit" disabled={submitting || email.length === 0} className="w-full bg-blue-600 text-white p-2 rounded">
            {submitting ? "Accesso..." : "Conferma"}
          </button>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        </form>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-16">
        <p role="alert" className="text-sm text-red-600">{error}</p>
      </main>
    );
  }
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <p>Accesso in corso...</p>
    </main>
  );
}
