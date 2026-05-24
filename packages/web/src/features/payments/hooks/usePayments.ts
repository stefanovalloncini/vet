import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  ActorContext,
  Payment,
  PaymentInput,
} from "@vet/shared";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { queryKeys } from "../../../shared/data/queryClient";

export function usePayments() {
  const { payments: repo } = useRepositories();
  return useQuery<Payment[]>({
    queryKey: queryKeys.payments(),
    queryFn: () => repo.list(),
  });
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
