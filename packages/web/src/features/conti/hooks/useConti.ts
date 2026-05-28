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

const KEY = ["conti"] as const;
const keyForAzienda = (id: string) => ["conti", "azienda", id] as const;
const KEY_UNSALDATI = ["conti", "unsaldati"] as const;

export function useConti() {
  const { conti } = useRepositories();
  return useQuery<Conto[]>({
    queryKey: KEY,
    queryFn: () => conti.list(),
  });
}

export function useContiForAzienda(aziendaId: string | undefined) {
  const { conti } = useRepositories();
  return useQuery<Conto[]>({
    queryKey: keyForAzienda(aziendaId ?? ""),
    queryFn: () =>
      aziendaId ? conti.listForAzienda(aziendaId) : Promise.resolve([]),
    enabled: !!aziendaId,
  });
}

export function useContiUnsaldati() {
  const { conti } = useRepositories();
  return useQuery<Conto[]>({
    queryKey: KEY_UNSALDATI,
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
      void qc.invalidateQueries({ queryKey: ["conti"] });
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
      void qc.invalidateQueries({ queryKey: ["conti"] });
    },
    meta: { errorMessage: "Salvataggio non riuscito" },
  });
}
