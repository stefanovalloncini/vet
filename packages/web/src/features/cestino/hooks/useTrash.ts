import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { Attivita, TrashFilters } from "@vet/shared";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import {
  ATTIVITA_DEPENDENT_KEYS,
  invalidateMany,
  queryKeys,
} from "../../../shared/data/queryClient";

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
    onSuccess: () => invalidateMany(qc, ATTIVITA_DEPENDENT_KEYS),
  });
}

export function usePurgeTrashed() {
  const { trash } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => trash.purgeAttivita(id),
    onSuccess: () => invalidateMany(qc, ATTIVITA_DEPENDENT_KEYS),
  });
}
