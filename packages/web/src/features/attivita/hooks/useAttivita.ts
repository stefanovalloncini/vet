import { useCallback, useEffect, useState } from "react";
import type { Attivita, AttivitaFilters } from "@vet/shared";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";

interface State {
  loading: boolean;
  error: string | null;
  items: Attivita[];
}

export function useAttivita(filters: AttivitaFilters = {}) {
  const { attivita: repo } = useRepositories();
  const [state, setState] = useState<State>({
    loading: true,
    error: null,
    items: [],
  });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const list = await repo.list(filters);
      setState({ loading: false, error: null, items: list });
    } catch {
      setState({ loading: false, error: "load-failed", items: [] });
    }
  }, [repo, filters.from, filters.to, filters.aziendaId, filters.tipoId, filters.ownerUid]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { ...state, refresh };
}
