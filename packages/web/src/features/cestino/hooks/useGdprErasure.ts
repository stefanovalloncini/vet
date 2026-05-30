import { useState } from "react";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { impostazioniI18n as t } from "../i18n";

const SIGN_OUT_DELAY_MS = 1500;

export interface GdprErasure {
  busy: boolean;
  done: boolean;
  error: string | null;
  erase: () => Promise<void>;
}

export function useGdprErasure(): GdprErasure {
  const { trash, auth } = useRepositories();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function erase(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await trash.gdprDeleteMine();
      setDone(true);
      setTimeout(() => {
        void auth.signOut();
      }, SIGN_OUT_DELAY_MS);
    } catch {
      setError(t.gdprErrore);
      setBusy(false);
    }
  }

  return { busy, done, error, erase };
}
