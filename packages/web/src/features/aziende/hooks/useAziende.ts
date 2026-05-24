import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  ActorContext,
  Azienda,
  AziendaInput,
} from "@vet/shared";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import {
  AZIENDE_DEPENDENT_KEYS,
  invalidateMany,
  queryKeys,
} from "../../../shared/data/queryClient";

export function useAziende() {
  const { aziende: repo } = useRepositories();
  return useQuery<Azienda[]>({
    queryKey: queryKeys.aziende,
    queryFn: () => repo.list(),
  });
}

export function useAzienda(id: string | undefined) {
  const { aziende: repo } = useRepositories();
  return useQuery<Azienda | null>({
    queryKey: id ? queryKeys.azienda(id) : queryKeys.azienda("__none__"),
    queryFn: () => (id ? repo.getById(id) : Promise.resolve(null)),
    enabled: id !== undefined,
  });
}

interface CreateInput {
  input: AziendaInput;
  actor: ActorContext;
}

export function useCreateAzienda() {
  const { aziende: repo } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ input, actor }: CreateInput) => repo.create(input, actor),
    onSuccess: () => invalidateMany(qc, AZIENDE_DEPENDENT_KEYS),
  });
}

interface UpdateInput {
  id: string;
  input: AziendaInput;
  actor: ActorContext;
}

export function useUpdateAzienda() {
  const { aziende: repo } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input, actor }: UpdateInput) =>
      repo.update(id, input, actor),
    onSuccess: () => invalidateMany(qc, AZIENDE_DEPENDENT_KEYS),
  });
}

interface DeleteInput {
  id: string;
  actor: ActorContext;
}

export function useDeleteAzienda() {
  const { aziende: repo } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, actor }: DeleteInput) => repo.softDelete(id, actor),
    onSuccess: () => invalidateMany(qc, AZIENDE_DEPENDENT_KEYS),
  });
}
