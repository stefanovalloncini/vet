import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Role, RoleInput } from "@vet/shared";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { queryKeys } from "../../../shared/data/queryClient";

export function useRoles() {
  const { roles: repo } = useRepositories();
  return useQuery<Role[]>({
    queryKey: queryKeys.roles,
    queryFn: async () => {
      const list = await repo.list();
      list.sort((a, b) => a.name.localeCompare(b.name, "it"));
      return list;
    },
  });
}

export function useRole(id: string | undefined) {
  const { roles: repo } = useRepositories();
  return useQuery<Role | null>({
    queryKey: id ? queryKeys.role(id) : queryKeys.role("__none__"),
    queryFn: () => (id ? repo.getById(id) : Promise.resolve(null)),
    enabled: Boolean(id),
  });
}

interface RoleWriteVars {
  id: string;
  input: RoleInput;
  actor: string;
}

function invalidateRoles(qc: ReturnType<typeof useQueryClient>): void {
  void qc.invalidateQueries({ queryKey: ["roles"] });
  void qc.invalidateQueries({ queryKey: ["allowlist"] });
}

export function useCreateRole() {
  const { roles: repo } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: RoleWriteVars) =>
      repo.create(vars.id, vars.input, vars.actor),
    onSuccess: () => invalidateRoles(qc),
  });
}

export function useUpdateRole() {
  const { roles: repo } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: RoleWriteVars) =>
      repo.update(vars.id, vars.input, vars.actor),
    onSuccess: () => invalidateRoles(qc),
  });
}

export function useDeleteRole() {
  const { roles: repo } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string }) => repo.delete(vars.id),
    onSuccess: () => invalidateRoles(qc),
  });
}
