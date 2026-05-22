import { useQuery } from "@tanstack/react-query";
import type { Attivita, AttivitaFilters } from "@vet/shared";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { queryKeys } from "../../../shared/data/queryClient";

export interface VetStat {
  readonly uid: string;
  readonly nome: string;
  readonly email: string;
  readonly total: number;
  readonly count: number;
}

function aggregate(items: ReadonlyArray<Attivita>): VetStat[] {
  const map = new Map<string, VetStat>();
  for (const a of items) {
    const cur = map.get(a.ownerUid) ?? {
      uid: a.ownerUid,
      nome: a.ownerName,
      email: a.ownerEmail,
      total: 0,
      count: 0,
    };
    map.set(a.ownerUid, {
      uid: cur.uid,
      nome: cur.nome,
      email: cur.email,
      total: cur.total + a.totale,
      count: cur.count + 1,
    });
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

export function useVetStats(filters: AttivitaFilters = {}) {
  const { attivita } = useRepositories();
  return useQuery<VetStat[]>({
    queryKey: queryKeys.vetStats(filters as Record<string, unknown>),
    queryFn: async () => aggregate(await attivita.list(filters)),
  });
}
