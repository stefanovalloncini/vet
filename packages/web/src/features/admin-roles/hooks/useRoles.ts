import { useCallback, useEffect, useState } from "react";
import type { Role } from "@vet/shared";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";

interface State {
  loading: boolean;
  error: string | null;
  roles: Role[];
}

export function useRoles() {
  const { roles: repo } = useRepositories();
  const [state, setState] = useState<State>({
    loading: true,
    error: null,
    roles: [],
  });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const list = await repo.list();
      list.sort((a, b) => a.name.localeCompare(b.name, "it"));
      setState({ loading: false, error: null, roles: list });
    } catch {
      setState({ loading: false, error: "load-failed", roles: [] });
    }
  }, [repo]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { ...state, refresh };
}
