import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

export interface AziendaDetail {
  azienda: Azienda | null;
  items: Attivita[];
  payments: Payment[];
  loading: boolean;
  error: string | null;
}

export function useAziendaDetail({
  id,
  aziende,
  attivita,
  payments,
}: UseAziendaDetailArgs): AziendaDetail {
  const navigate = useNavigate();
  const [azienda, setAzienda] = useState<Azienda | null>(null);
  const [items, setItems] = useState<Attivita[]>([]);
  const [pays, setPays] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void (async () => {
      try {
        const [az, list, pa] = await Promise.all([
          aziende.getById(id),
          attivita.list({ aziendaId: id }),
          payments.listForAzienda(id),
        ]);
        if (cancelled) return;
        if (!az) {
          navigate("/aziende", { replace: true });
          return;
        }
        setAzienda(az);
        setItems(list);
        setPays(pa);
      } catch (err) {
        if (cancelled) return;
        console.error("azienda detail load failed", err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, aziende, attivita, payments, navigate]);

  return { azienda, items, payments: pays, loading, error };
}
