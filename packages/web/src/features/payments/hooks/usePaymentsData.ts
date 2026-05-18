import { useCallback, useEffect, useState } from "react";
import type { Attivita, Azienda, Payment } from "@vet/shared";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";

interface State {
  loading: boolean;
  error: string | null;
  aziende: Azienda[];
  attivita: Attivita[];
  payments: Payment[];
}

export function usePaymentsData() {
  const { aziende, attivita, payments } = useRepositories();
  const [state, setState] = useState<State>({
    loading: true,
    error: null,
    aziende: [],
    attivita: [],
    payments: [],
  });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const [a, t, p] = await Promise.all([
        aziende.list(),
        attivita.list(),
        payments.list(),
      ]);
      setState({
        loading: false,
        error: null,
        aziende: a,
        attivita: t,
        payments: p,
      });
    } catch {
      setState({
        loading: false,
        error: "load-failed",
        aziende: [],
        attivita: [],
        payments: [],
      });
    }
  }, [aziende, attivita, payments]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { ...state, refresh };
}
