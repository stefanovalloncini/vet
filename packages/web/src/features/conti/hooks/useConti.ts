import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  ActorContext,
  Conto,
  ContoEmitInput,
  ContoSaldoInput,
} from "@vet/shared";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { queryKeys } from "../../../shared/data/queryClient";

export function useConti() {
  const { conti } = useRepositories();
  return useQuery<Conto[]>({
    queryKey: queryKeys.conti,
    queryFn: () => conti.list(),
  });
}

export function useContiForAzienda(aziendaId: string | undefined) {
  const { conti } = useRepositories();
  return useQuery<Conto[]>({
    queryKey: queryKeys.contiForAzienda(aziendaId ?? ""),
    queryFn: () =>
      aziendaId ? conti.listForAzienda(aziendaId) : Promise.resolve([]),
    enabled: !!aziendaId,
  });
}

export function useContiUnsaldati() {
  const { conti } = useRepositories();
  return useQuery<Conto[]>({
    queryKey: queryKeys.contiUnsaldati,
    queryFn: () => conti.listUnsaldati(),
  });
}

interface EmitVars {
  input: ContoEmitInput;
  denorm: {
    aziendaNome: string;
    attivitaIds: string[];
    totaleConto: number;
  };
  actor: ActorContext;
}

export function useEmettiConto() {
  const { conti } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: EmitVars) =>
      conti.emit(vars.input, vars.denorm, vars.actor),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.conti });
    },
    meta: { errorMessage: "Salvataggio non riuscito" },
  });
}

interface SaldoVars {
  input: ContoSaldoInput;
  actor: ActorContext;
}

export function useSaldaConto() {
  const { conti } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: SaldoVars) => conti.saldo(vars.input, vars.actor),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.conti });
    },
    meta: { errorMessage: "Salvataggio non riuscito" },
  });
}
