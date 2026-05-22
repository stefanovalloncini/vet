import {
  useMutation,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import type { ActorContext, Attivita } from "@vet/shared";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";

interface UndoVars {
  id: string;
  user: ActorContext;
}

interface UndoContext {
  snapshots: Array<[QueryKey, Attivita[] | undefined]>;
}

const ATTIVITA_KEY = ["attivita"] as const;

export function useUndoCreateAttivita() {
  const { attivita: repo } = useRepositories();
  const qc = useQueryClient();
  return useMutation<void, Error, UndoVars, UndoContext>({
    mutationFn: ({ id, user }) => repo.softDelete(id, user),
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: ATTIVITA_KEY });
      const snapshots = qc.getQueriesData<Attivita[]>({
        queryKey: ATTIVITA_KEY,
      });
      qc.setQueriesData<Attivita[]>(
        { queryKey: ATTIVITA_KEY },
        (old) => (old ?? []).filter((a) => a.id !== id)
      );
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ATTIVITA_KEY });
    },
  });
}
