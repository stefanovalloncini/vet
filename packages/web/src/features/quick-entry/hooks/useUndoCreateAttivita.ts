import {
  useMutation,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import type { ActorContext, Attivita } from "@vet/shared";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import {
  ATTIVITA_DEPENDENT_KEYS,
  invalidateMany,
} from "../../../shared/data/queryClient";

interface UndoVars {
  id: string;
  user: ActorContext;
}

interface UndoContext {
  snapshots: Array<[QueryKey, Attivita[] | undefined]>;
}

const OPTIMISTICALLY_PATCHED_KEYS: ReadonlyArray<QueryKey> = [
  ["attivita"],
  ["agenda"],
  ["trash"],
];

export function useUndoCreateAttivita() {
  const { attivita: repo } = useRepositories();
  const qc = useQueryClient();
  return useMutation<void, Error, UndoVars, UndoContext>({
    mutationFn: ({ id, user }) => repo.softDelete(id, user),
    meta: { errorMessage: "Annullamento non riuscito" },
    onMutate: async ({ id }) => {
      await Promise.all(
        OPTIMISTICALLY_PATCHED_KEYS.map((key) =>
          qc.cancelQueries({ queryKey: key })
        )
      );
      const snapshots: UndoContext["snapshots"] = [];
      for (const key of OPTIMISTICALLY_PATCHED_KEYS) {
        snapshots.push(...qc.getQueriesData<Attivita[]>({ queryKey: key }));
        qc.setQueriesData<Attivita[]>({ queryKey: key }, (old) =>
          Array.isArray(old) ? old.filter((a) => a.id !== id) : old
        );
      }
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => {
      invalidateMany(qc, ATTIVITA_DEPENDENT_KEYS);
    },
  });
}
