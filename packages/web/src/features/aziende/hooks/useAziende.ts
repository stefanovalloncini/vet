import { useCallback, useEffect, useState } from "react";
import type { Azienda } from "@vet/shared";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";

interface UseAziendeState {
  loading: boolean;
  error: string | null;
  aziende: Azienda[];
}

export function useAziende() {
  const { aziende: repo } = useRepositories();
  const [state, setState] = useState<UseAziendeState>({
    loading: true,
    error: null,
    aziende: [],
  });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const list = await repo.list();
      setState({ loading: false, error: null, aziende: list });
    } catch {
      setState({ loading: false, error: "load-failed", aziende: [] });
    }
  }, [repo]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { ...state, refresh };
}
