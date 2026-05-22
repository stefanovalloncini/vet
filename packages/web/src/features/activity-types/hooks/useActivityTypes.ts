import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ActivityType, ActivityTypeInput } from "@vet/shared";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { queryKeys } from "../../../shared/data/queryClient";

export function useTipiAttivita() {
  const { activityTypes: repo } = useRepositories();
  return useQuery({
    queryKey: queryKeys.tipiAttivita,
    queryFn: () => repo.list(),
  });
}

interface UpsertVars {
  id: string;
  input: ActivityTypeInput;
}

export function useCreateTipoAttivita() {
  const { activityTypes: repo } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: UpsertVars): Promise<ActivityType> => {
      await repo.upsert(id, input);
      const created = await repo.getById(id);
      if (!created) throw new Error("not-found");
      return created;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tipiAttivita }),
  });
}

export function useUpdateTipoAttivita() {
  const { activityTypes: repo } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: UpsertVars) => repo.upsert(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tipiAttivita }),
  });
}

interface ToggleVars {
  id: string;
  attivo: boolean;
}

export function useToggleTipoAttivitaActive() {
  const { activityTypes: repo } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, attivo }: ToggleVars) => repo.setActive(id, attivo),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tipiAttivita }),
  });
}

interface TariffaVars {
  id: string;
  tariffa: number | null;
}

export function useSaveTipoTariffa() {
  const { activityTypes: repo } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, tariffa }: TariffaVars) =>
      repo.setStandardTariff(id, tariffa),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tipiAttivita }),
  });
}
