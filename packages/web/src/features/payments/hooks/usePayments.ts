import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  ActorContext,
  Attivita,
  Azienda,
  Payment,
  PaymentInput,
} from "@vet/shared";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { queryKeys } from "../../../shared/data/queryClient";

interface PaymentsData {
  aziende: Azienda[];
  attivita: Attivita[];
  payments: Payment[];
}

export interface UsePaymentsDataResult extends PaymentsData {
  loading: boolean;
  error: string | null;
}

const EMPTY: PaymentsData = { aziende: [], attivita: [], payments: [] };

export function usePaymentsData(): UsePaymentsDataResult {
  const { aziende, attivita, payments } = useRepositories();
  const query = useQuery<PaymentsData>({
    queryKey: queryKeys.payments(),
    queryFn: async () => {
      const [a, t, p] = await Promise.all([
        aziende.list(),
        attivita.list(),
        payments.list(),
      ]);
      return { aziende: a, attivita: t, payments: p };
    },
  });
  const data = query.data ?? EMPTY;
  return {
    aziende: data.aziende,
    attivita: data.attivita,
    payments: data.payments,
    loading: query.isPending,
    error: query.error ? "load-failed" : null,
  };
}

interface CreatePaymentInput {
  input: PaymentInput;
  denorm: { aziendaNome: string };
  actor: ActorContext;
}

function invalidatePaymentsScope(qc: ReturnType<typeof useQueryClient>): void {
  void qc.invalidateQueries({ queryKey: ["payments"] });
  void qc.invalidateQueries({ queryKey: queryKeys.aziende });
}

export function useCreatePayment() {
  const { payments } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ input, denorm, actor }: CreatePaymentInput) =>
      payments.create(input, denorm, actor),
    onSuccess: () => invalidatePaymentsScope(qc),
  });
}

interface DeletePaymentInput {
  id: string;
  actor: ActorContext;
}

export function useDeletePayment() {
  const { payments } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, actor }: DeletePaymentInput) =>
      payments.delete(id, actor),
    onSuccess: () => invalidatePaymentsScope(qc),
  });
}
