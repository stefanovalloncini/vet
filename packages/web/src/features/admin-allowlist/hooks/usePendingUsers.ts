import { useEffect, useState } from "react";
import type { User } from "@vet/shared";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";

interface PendingUsersState {
  items: User[];
  loading: boolean;
  error: unknown;
}

export function usePendingUsers() {
  const { users } = useRepositories();
  const [state, setState] = useState<PendingUsersState>({
    items: [],
    loading: true,
    error: null,
  });

  async function refresh() {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const items = await users.listPending();
      setState({ items, loading: false, error: null });
    } catch (error) {
      setState((s) => ({ ...s, loading: false, error }));
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users]);

  return { ...state, refresh };
}
