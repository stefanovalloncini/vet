import { useCallback, useEffect, useState } from "react";
import type { AllowlistEntry, Role } from "@vet/shared";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";

interface State {
  loading: boolean;
  error: string | null;
  entries: AllowlistEntry[];
  roles: Role[];
}

export function useAllowlist() {
  const { allowlist, roles: rolesRepo } = useRepositories();
  const [state, setState] = useState<State>({
    loading: true,
    error: null,
    entries: [],
    roles: [],
  });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const [entries, roles] = await Promise.all([
        allowlist.list(),
        rolesRepo.list(),
      ]);
      entries.sort((a, b) => a.email.localeCompare(b.email, "it"));
      roles.sort((a, b) => a.name.localeCompare(b.name, "it"));
      setState({ loading: false, error: null, entries, roles });
    } catch {
      setState({ loading: false, error: "load-failed", entries: [], roles: [] });
    }
  }, [allowlist, rolesRepo]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { ...state, refresh };
}
