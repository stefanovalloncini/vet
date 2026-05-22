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

interface UseAziendaDetailArgs {
  id: string | undefined;
  aziende: AziendeRepository;
  attivita: AttivitaRepository;
  payments: PaymentsRepository;
}

interface AziendaDetailData {
  azienda: Azienda | null;
  items: Attivita[];
  payments: Payment[];
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

async function loadDetail(
  id: string,
  aziende: AziendeRepository,
  attivita: AttivitaRepository,
  payments: PaymentsRepository
): Promise<AziendaDetailData> {
  const [azienda, items, pays] = await Promise.all([
    aziende.getById(id),
    attivita.list({ aziendaId: id }),
    payments.listForAzienda(id),
  ]);
  return { azienda, items, payments: pays };
}

export function useAziendaDetail({
  id,
  aziende,
  attivita,
  payments,
}: UseAziendaDetailArgs): AziendaDetail {
  const navigate = useNavigate();
  const query = useQuery<AziendaDetailData>({
    queryKey: id ? ["aziende", id, "detail"] : ["aziende", "none", "detail"],
    queryFn: () => loadDetail(id as string, aziende, attivita, payments),
    enabled: id !== undefined,
  });

  const missing = query.isSuccess && query.data.azienda === null;
  useEffect(() => {
    if (missing) navigate("/aziende", { replace: true });
  }, [missing, navigate]);

  return {
    azienda: query.data?.azienda ?? null,
    items: query.data?.items ?? [],
    payments: query.data?.payments ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: () => {
      void query.refetch();
    },
  };
}
