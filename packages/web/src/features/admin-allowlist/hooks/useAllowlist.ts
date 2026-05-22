import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AllowlistEntry,
  AllowlistEntryInput,
  Role,
} from "@vet/shared";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { queryKeys } from "../../../shared/data/queryClient";

export interface UseAllowlistResult {
  entries: AllowlistEntry[];
  roles: Role[];
  loading: boolean;
  error: unknown;
}

export function useAllowlist(): UseAllowlistResult {
  const { allowlist, roles: rolesRepo } = useRepositories();
  const query = useQuery({
    queryKey: queryKeys.allowlist,
    queryFn: async () => {
      const [entries, roles] = await Promise.all([
        allowlist.list(),
        rolesRepo.list(),
      ]);
      entries.sort((a, b) => a.email.localeCompare(b.email, "it"));
      roles.sort((a, b) => a.name.localeCompare(b.name, "it"));
      return { entries, roles };
    },
  });
  return {
    entries: query.data?.entries ?? [],
    roles: query.data?.roles ?? [],
    loading: query.isPending,
    error: query.error,
  };
}

interface AddInput {
  input: AllowlistEntryInput;
  actor: string;
}

export function useAddAllowlistEntry() {
  const { allowlist } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ input, actor }: AddInput) => allowlist.add(input, actor),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.allowlist }),
  });
}

export function useRemoveAllowlistEntry() {
  const { allowlist } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => allowlist.remove(email),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.allowlist }),
  });
}
