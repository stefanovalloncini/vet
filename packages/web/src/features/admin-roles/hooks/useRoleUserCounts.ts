import { useQueries } from "@tanstack/react-query";
import type { Role } from "@vet/shared";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { queryKeys } from "../../../shared/data/queryClient";

export interface RoleUserCount {
  readonly roleId: string;
  readonly count: number | null;
  readonly loading: boolean;
}

export function useRoleUserCounts(
  roles: ReadonlyArray<Role>
): ReadonlyArray<RoleUserCount> {
  const { users } = useRepositories();
  const results = useQueries({
    queries: roles.map((role) => ({
      queryKey: queryKeys.roleUserCount(role.id),
      queryFn: async () => (await users.listByRole(role.id)).length,
    })),
  });
  return results.map((r, i) => ({
    roleId: roles[i]?.id ?? "",
    count: typeof r.data === "number" ? r.data : null,
    loading: r.isLoading,
  }));
}
