import { useCallback, useEffect, useState } from "react";
import type { Reminder } from "@vet/shared";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";

interface State {
  loading: boolean;
  error: string | null;
  reminders: Reminder[];
}

export function useReminders(opts: { onlyOpen?: boolean } = {}) {
  const { reminders: repo } = useRepositories();
  const [state, setState] = useState<State>({
    loading: true,
    error: null,
    reminders: [],
  });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const list = await repo.list(opts);
      setState({ loading: false, error: null, reminders: list });
    } catch {
      setState({ loading: false, error: "load-failed", reminders: [] });
    }
  }, [repo, opts.onlyOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { ...state, refresh };
}
