import { useEffect, useState } from "react";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";

export function EmailLinkCompletePage() {
  const { auth } = useRepositories();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    auth.completeEmailSignIn(window.location.href).catch(() => {
      setError("Link non valido o scaduto.");
    });
  }, [auth]);

  if (error) return <p role="alert">{error}</p>;
  return <p>Accesso in corso...</p>;
}
