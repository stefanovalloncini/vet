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
import { queryKeys } from "../../../shared/data/queryClient";

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
    queryKey: id ? queryKeys.azienda(id) : ["aziende", "none"],
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aziende"] }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aziende"] }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aziende"] }),
  });
}
