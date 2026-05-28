import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  ActorContext,
  Reminder,
  ReminderInput,
} from "@vet/shared";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import {
  invalidateMany,
  queryKeys,
  REMINDERS_DEPENDENT_KEYS,
} from "../../../shared/data/queryClient";

export interface UseRemindersResult {
  reminders: Reminder[];
  loading: boolean;
  error: string | null;
}

export function useReminders(
  opts: { onlyOpen?: boolean } = {}
): UseRemindersResult {
  const { reminders: repo } = useRepositories();
  const filters = opts.onlyOpen ? { onlyOpen: true } : {};
  const query = useQuery<Reminder[]>({
    queryKey: queryKeys.reminders(filters),
    queryFn: () => repo.list(filters),
  });
  return {
    reminders: query.data ?? [],
    loading: query.isPending,
    error: query.error ? "load-failed" : null,
  };
}

interface CreateReminderInput {
  input: ReminderInput;
  denorm: { aziendaNome: string };
  actor: ActorContext;
}

export function useCreateReminder() {
  const { reminders: repo } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ input, denorm, actor }: CreateReminderInput) =>
      repo.create(input, denorm, actor),
    onSuccess: () => invalidateMany(qc, REMINDERS_DEPENDENT_KEYS),
    meta: { errorMessage: "Promemoria non creato" },
  });
}

interface UpdateReminderInput {
  id: string;
  done: boolean;
}

export function useUpdateReminder() {
  const { reminders: repo } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, done }: UpdateReminderInput) => repo.markDone(id, done),
    onSuccess: () => invalidateMany(qc, REMINDERS_DEPENDENT_KEYS),
    meta: { errorMessage: "Operazione non riuscita" },
  });
}

export function useDeleteReminder() {
  const { reminders: repo } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repo.delete(id),
    onSuccess: () => invalidateMany(qc, REMINDERS_DEPENDENT_KEYS),
    meta: { errorMessage: "Eliminazione non riuscita" },
  });
}
