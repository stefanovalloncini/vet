import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AllowlistEntry,
  AllowlistEntryInput,
  Role,
} from "@vet/shared";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { queryKeys } from "../../../shared/data/queryClient";
import { useRoles } from "../../admin-roles/hooks/useRoles";

export interface UseAllowlistResult {
  entries: AllowlistEntry[];
  roles: Role[];
  loading: boolean;
  error: unknown;
}

export function useAllowlistEntries() {
  const { allowlist } = useRepositories();
  return useQuery<AllowlistEntry[]>({
    queryKey: queryKeys.allowlist,
    queryFn: async () => {
      const entries = await allowlist.list();
      entries.sort((a, b) => a.email.localeCompare(b.email, "it"));
      return entries;
    },
  });
}

export function useAllowlist(): UseAllowlistResult {
  const entries = useAllowlistEntries();
  const roles = useRoles();
  return {
    entries: entries.data ?? [],
    roles: roles.data ?? [],
    loading: entries.isPending || roles.isPending,
    error: entries.error ?? roles.error,
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
