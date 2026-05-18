import { useEffect, useState } from "react";
import type { ActivityType, Azienda } from "@vet/shared";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";

interface State {
  loading: boolean;
  aziende: Azienda[];
  tipi: ActivityType[];
}

export function useReferenceData() {
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

  return state;
}
