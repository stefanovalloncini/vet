import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getFunctions, httpsCallable } from "firebase/functions";
import type { AccessRequest } from "@vet/shared";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { queryKeys } from "../../../shared/data/queryClient";

export interface UseAccessRequestsResult {
  items: AccessRequest[];
  loading: boolean;
  error: unknown;
}

export function useAccessRequests(): UseAccessRequestsResult {
  const { accessRequests } = useRepositories();
  const query = useQuery<AccessRequest[]>({
    queryKey: queryKeys.accessRequests,
    queryFn: () => accessRequests.list(),
  });
  return {
    items: query.data ?? [],
    loading: query.isPending,
    error: query.error,
  };
}

function callable<TIn, TOut>(name: string) {
  return httpsCallable<TIn, TOut>(getFunctions(undefined, "europe-west8"), name);
}

interface AcceptInput {
  email: string;
  roleId: string;
}

export function useAcceptAccessRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AcceptInput) => {
      await callable<AcceptInput, void>("acceptAccessRequest")(input);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.accessRequests });
      void qc.invalidateQueries({ queryKey: queryKeys.allowlist });
      void qc.invalidateQueries({ queryKey: queryKeys.roleUserCounts });
    },
    meta: { errorMessage: "Operazione non riuscita" },
  });
}

export function useRejectAccessRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (email: string) => {
      await callable<{ email: string }, void>("rejectAccessRequest")({ email });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.accessRequests }),
    meta: { errorMessage: "Operazione non riuscita" },
  });
}
