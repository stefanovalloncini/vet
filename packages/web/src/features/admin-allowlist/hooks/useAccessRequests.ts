import { useEffect, useState } from "react";
import type { AccessRequest } from "@vet/shared";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";

interface AccessRequestsState {
  items: AccessRequest[];
  loading: boolean;
  error: unknown;
}

export function useAccessRequests() {
  const { accessRequests } = useRepositories();
  const [state, setState] = useState<AccessRequestsState>({
    items: [],
    loading: true,
    error: null,
  });

  async function refresh(): Promise<void> {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const items = await accessRequests.list();
      setState({ items, loading: false, error: null });
    } catch (error) {
      setState((s) => ({ ...s, loading: false, error }));
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessRequests]);

  return { ...state, refresh };
}
