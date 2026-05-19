import { useCallback, useEffect, useState } from "react";
import type { ActivityType, Azienda } from "@vet/shared";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";

interface State {
  loading: boolean;
  aziende: Azienda[];
  tipi: ActivityType[];
}

export interface ReferenceData extends State {
  addAzienda: (a: Azienda) => void;
  addTipo: (t: ActivityType) => void;
}

export function useReferenceData(): ReferenceData {
  const { aziende: aziendeRepo, activityTypes } = useRepositories();
  const [state, setState] = useState<State>({
    loading: true,
    aziende: [],
    tipi: [],
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [aziende, tipi] = await Promise.all([
        aziendeRepo.list(),
        activityTypes.listActive(),
      ]);
      if (!cancelled) {
        setState({ loading: false, aziende, tipi });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [aziendeRepo, activityTypes]);

  const addAzienda = useCallback((a: Azienda) => {
    setState((s) => ({
      ...s,
      aziende: [...s.aziende, a].sort((x, y) =>
        x.nome.localeCompare(y.nome, "it")
      ),
    }));
  }, []);

  const addTipo = useCallback((t: ActivityType) => {
    setState((s) => ({
      ...s,
      tipi: [...s.tipi, t].sort((x, y) => x.ordine - y.ordine),
    }));
  }, []);

  return { ...state, addAzienda, addTipo };
}
