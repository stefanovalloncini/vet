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
  filterKey,
  invalidateMany,
  queryKeys,
} from "../../../shared/data/queryClient";

type Denorm = { aziendaNome: string; tipoNome: string };

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

export function useHasAnyAttivita(enabled: boolean) {
  const { attivita: repo } = useRepositories();
  return useQuery<boolean>({
    queryKey: queryKeys.attivitaHasAny,
    queryFn: () => repo.hasAnyActive(),
    enabled,
  });
}

export function useLastAttivitaByAziendaAndTipo(
  aziendaId: string | undefined,
  tipoId: string | undefined,
  options: { enabled?: boolean } = {}
) {
  const { attivita: repo } = useRepositories();
  const ready = !!aziendaId && !!tipoId;
  const enabled = (options.enabled ?? true) && ready;
  return useQuery<Attivita | null>({
    queryKey: queryKeys.attivitaLastByAziendaAndTipo(aziendaId, tipoId),
    queryFn: () =>
      ready
        ? repo.findLastByAziendaAndTipo(aziendaId as string, tipoId as string)
        : Promise.resolve(null),
    enabled,
  });
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
    meta: { errorMessage: "Salvataggio non riuscito." },
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
    meta: { errorMessage: "Salvataggio non riuscito." },
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
    meta: { errorMessage: "Salvataggio non riuscito." },
  });
}
