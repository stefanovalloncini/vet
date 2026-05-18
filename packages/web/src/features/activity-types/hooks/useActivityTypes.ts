import { useCallback, useEffect, useState } from "react";
import type { ActivityType } from "@vet/shared";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";

interface State {
  loading: boolean;
  error: string | null;
  types: ActivityType[];
}

export function useActivityTypes() {
  const { activityTypes: repo } = useRepositories();
  const [state, setState] = useState<State>({
    loading: true,
    error: null,
    types: [],
  });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const list = await repo.list();
      setState({ loading: false, error: null, types: list });
    } catch {
      setState({ loading: false, error: "load-failed", types: [] });
    }
  }, [repo]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { ...state, refresh };
}
