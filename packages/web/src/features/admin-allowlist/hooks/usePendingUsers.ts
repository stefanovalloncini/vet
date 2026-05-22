import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@vet/shared";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { queryKeys } from "../../../shared/data/queryClient";

export interface UsePendingUsersResult {
  items: User[];
  loading: boolean;
  error: unknown;
}

export function usePendingUsers(): UsePendingUsersResult {
  const { users } = useRepositories();
  const query = useQuery<User[]>({
    queryKey: queryKeys.pendingUsers,
    queryFn: () => users.listPending(),
  });
  return {
    items: query.data ?? [],
    loading: query.isPending,
    error: query.error,
  };
}

interface ApproveInput {
  uid: string;
  roleId: string;
}

export function useApprovePendingUser() {
  const { users } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ uid, roleId }: ApproveInput) => users.approve(uid, roleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.pendingUsers }),
  });
}

export function useRejectPendingUser() {
  const { users } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (uid: string) => users.delete(uid),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.pendingUsers }),
  });
}
