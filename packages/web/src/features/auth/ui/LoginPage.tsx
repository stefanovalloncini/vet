import { useState, type FormEvent } from "react";
import styles from "./LoginPage.module.css";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";

export function LoginPage() {
  const { auth } = useRepositories();
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogle() {
    setError(null);
    try {
      await auth.signInWithGoogle();
    } catch {
      setError("Accesso non riuscito. Riprova.");
    }
  }

  async function handleEmail(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await auth.sendEmailSignInLink(email);
      setEmailSent(true);
    } catch {
      setError("Invio link non riuscito.");
    }
  }

  return (
    <main className={styles.shell}>
      <h1 className={styles.heading}>Accedi a Vet</h1>
      <button type="button" className={styles.button} onClick={handleGoogle}>
        Continua con Google
      </button>
      <p className={styles.divider}>oppure</p>
      {emailSent ? (
        <p>Controlla la tua email per il link di accesso.</p>
      ) : (
        <form onSubmit={handleEmail}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" className={styles.button}>
            Inviami il link
          </button>
        </form>
      )}
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
    </main>
  );
}
