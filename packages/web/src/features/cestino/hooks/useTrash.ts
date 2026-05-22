import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { Attivita, TrashFilters } from "@vet/shared";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { queryKeys } from "../../../shared/data/queryClient";

interface UseTrashResult {
  items: Attivita[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useTrash(filters: TrashFilters): UseTrashResult {
  const { attivita } = useRepositories();

  const query = useQuery<Attivita[]>({
    queryKey: queryKeys.trash({ ...filters }),
    queryFn: () => attivita.listDeleted(filters),
  });

  const refresh = async (): Promise<void> => {
    await query.refetch();
  };

  return {
    items: query.data ?? [],
    loading: query.isPending,
    error: query.isError ? "load-failed" : null,
    refresh,
  };
}

export function useRestoreTrashed() {
  const { trash } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => trash.restoreAttivita(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["trash"] });
      void qc.invalidateQueries({ queryKey: ["attivita"] });
    },
  });
}

export function usePurgeTrashed() {
  const { trash } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => trash.purgeAttivita(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["trash"] });
    },
  });
}
