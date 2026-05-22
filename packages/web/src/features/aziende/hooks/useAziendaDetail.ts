import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type {
  Attivita,
  AttivitaRepository,
  Azienda,
  AziendeRepository,
  Payment,
  PaymentsRepository,
} from "@vet/shared";
import { queryKeys } from "../../../shared/data/queryClient";

interface UseAziendaDetailArgs {
  id: string | undefined;
  aziende: AziendeRepository;
  attivita: AttivitaRepository;
  payments: PaymentsRepository;
}

export interface AziendaDetail {
  azienda: Azienda | null;
  items: Attivita[];
  payments: Payment[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

const NONE_KEY = ["aziende", "__none__"] as const;
const EMPTY_ITEMS: Attivita[] = [];
const EMPTY_PAYMENTS: Payment[] = [];

export function useAziendaDetail({
  id,
  aziende,
  attivita,
  payments,
}: UseAziendaDetailArgs): AziendaDetail {
  const navigate = useNavigate();
  const enabled = id !== undefined;

  const aziendaQuery = useQuery<Azienda | null>({
    queryKey: enabled ? queryKeys.azienda(id) : NONE_KEY,
    queryFn: () => aziende.getById(id as string),
    enabled,
  });

  const attivitaQuery = useQuery<Attivita[]>({
    queryKey: queryKeys.attivita({ aziendaId: id ?? "" }),
    queryFn: () => attivita.list({ aziendaId: id as string }),
    enabled,
  });

  const paymentsQuery = useQuery<Payment[]>({
    queryKey: queryKeys.payments({ aziendaId: id ?? "" }),
    queryFn: () => payments.listForAzienda(id as string),
    enabled,
  });

  const missing =
    aziendaQuery.isSuccess && aziendaQuery.data === null;
  useEffect(() => {
    if (missing) navigate("/aziende", { replace: true });
  }, [missing, navigate]);

  const isLoading =
    aziendaQuery.isLoading ||
    attivitaQuery.isLoading ||
    paymentsQuery.isLoading;
  const isError =
    aziendaQuery.isError || attivitaQuery.isError || paymentsQuery.isError;
  const error =
    (aziendaQuery.error as Error | null) ??
    (attivitaQuery.error as Error | null) ??
    (paymentsQuery.error as Error | null);

  return {
    azienda: aziendaQuery.data ?? null,
    items: attivitaQuery.data ?? EMPTY_ITEMS,
    payments: paymentsQuery.data ?? EMPTY_PAYMENTS,
    isLoading,
    isError,
    error,
    refetch: () => {
      void aziendaQuery.refetch();
      void attivitaQuery.refetch();
      void paymentsQuery.refetch();
    },
  };
}
