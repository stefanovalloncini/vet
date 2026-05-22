import { useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ActivityType, Azienda } from "@vet/shared";
import { useAziende } from "../../aziende/hooks/useAziende";
import { useTipiAttivita } from "../../activity-types/hooks/useActivityTypes";
import { queryKeys } from "../../../shared/data/queryClient";

export interface ReferenceData {
  loading: boolean;
  isError?: boolean;
  aziende: Azienda[];
  tipi: ActivityType[];
  addAzienda: (a: Azienda) => void;
  addTipo: (t: ActivityType) => void;
}

export function useReferenceData(): ReferenceData {
  const qc = useQueryClient();
  const aziendeQuery = useAziende();
  const tipiQuery = useTipiAttivita();

  const aziende = useMemo(
    () =>
      [...(aziendeQuery.data ?? [])].sort((a, b) =>
        a.nome.localeCompare(b.nome, "it")
      ),
    [aziendeQuery.data]
  );

  const tipi = useMemo(
    () =>
      [...(tipiQuery.data ?? [])]
        .filter((t) => t.attivo)
        .sort((a, b) => a.ordine - b.ordine),
    [tipiQuery.data]
  );

  const addAzienda = useCallback(
    (a: Azienda) => {
      qc.setQueryData<Azienda[]>(queryKeys.aziende, (prev) =>
        prev && prev.some((p) => p.id === a.id) ? prev : [...(prev ?? []), a]
      );
    },
    [qc]
  );

  const addTipo = useCallback(
    (t: ActivityType) => {
      qc.setQueryData<ActivityType[]>(queryKeys.tipiAttivita, (prev) =>
        prev && prev.some((p) => p.id === t.id) ? prev : [...(prev ?? []), t]
      );
    },
    [qc]
  );

  return {
    loading: aziendeQuery.isLoading || tipiQuery.isLoading,
    isError: aziendeQuery.isError || tipiQuery.isError,
    aziende,
    tipi,
    addAzienda,
    addTipo,
  };
}
