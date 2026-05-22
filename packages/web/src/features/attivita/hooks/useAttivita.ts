import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  ActorContext,
  Attivita,
  AttivitaFilters,
  AttivitaInput,
} from "@vet/shared";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import {
  ATTIVITA_DEPENDENT_KEYS,
  invalidateMany,
  queryKeys,
} from "../../../shared/data/queryClient";

type Denorm = { aziendaNome: string; tipoNome: string };

function filterKey(filters: AttivitaFilters | undefined) {
  if (!filters) return {};
  return {
    from: filters.from?.toISOString(),
    to: filters.to?.toISOString(),
    aziendaId: filters.aziendaId,
    tipoId: filters.tipoId,
    ownerUid: filters.ownerUid,
  };
}

export function useAttivita(filters: AttivitaFilters = {}) {
  const { attivita: repo } = useRepositories();
  const query = useQuery<Attivita[]>({
    queryKey: queryKeys.attivita(filterKey(filters)),
    queryFn: () => repo.list(filters),
  });
  return {
    data: query.data,
    items: query.data ?? [],
    isLoading: query.isLoading,
    loading: query.isLoading,
    isError: query.isError,
    error: query.isError ? "load-failed" : null,
    refetch: query.refetch,
  };
}

interface CreateVars {
  input: AttivitaInput;
  denorm: Denorm;
  actor: ActorContext;
}

export function useCreateAttivita() {
  const { attivita: repo } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ input, denorm, actor }: CreateVars) =>
      repo.create(input, denorm, actor),
    onSuccess: () => invalidateMany(qc, ATTIVITA_DEPENDENT_KEYS),
  });
}

interface UpdateVars {
  id: string;
  input: AttivitaInput;
  denorm: Denorm;
  actor: ActorContext;
}

export function useUpdateAttivita() {
  const { attivita: repo } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input, denorm, actor }: UpdateVars) =>
      repo.update(id, input, denorm, actor),
    onSuccess: () => invalidateMany(qc, ATTIVITA_DEPENDENT_KEYS),
  });
}

interface DeleteVars {
  id: string;
  actor: ActorContext;
}

export function useSoftDeleteAttivita() {
  const { attivita: repo } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, actor }: DeleteVars) => repo.softDelete(id, actor),
    onSuccess: () => invalidateMany(qc, ATTIVITA_DEPENDENT_KEYS),
  });
}
