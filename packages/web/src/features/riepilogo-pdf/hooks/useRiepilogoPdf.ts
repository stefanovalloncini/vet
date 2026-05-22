import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type {
  Attivita,
  AttivitaRepository,
  Azienda,
  AziendeRepository,
} from "@vet/shared";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { formatDate, formatEuro, parseDateInput } from "../../attivita/lib/format";
import { queryKeys } from "../../../shared/data/queryClient";

export interface RiepilogoFilters {
  aziendaId: string;
  fromStr: string;
  toStr: string;
}

export interface RiepilogoSummary {
  azienda: Azienda;
  items: Attivita[];
  total: number;
  from: Date | null;
  to: Date | null;
  vetName: string;
}

export interface UseRiepilogoPdfResult {
  loading: boolean;
  isLoading: boolean;
  isError: boolean;
  error: "not-found" | "load-failed" | null;
  summary: RiepilogoSummary | null;
  generatePdf: () => void;
  shareWhatsApp: () => void;
}

interface RiepilogoData {
  azienda: Azienda | null;
  items: Attivita[];
}

async function loadRiepilogo(
  aziendaId: string,
  fromStr: string,
  toStr: string,
  aziende: AziendeRepository,
  attivita: AttivitaRepository
): Promise<RiepilogoData> {
  const a = await aziende.getById(aziendaId);
  if (!a) return { azienda: null, items: [] };
  const q: { aziendaId: string; from?: Date; to?: Date } = { aziendaId };
  const fromD = parseDateInput(fromStr);
  const toD = parseDateInput(toStr);
  if (fromD) q.from = fromD;
  if (toD) {
    const end = new Date(toD);
    end.setHours(23, 59, 59, 999);
    q.to = end;
  }
  const list = await attivita.list(q);
  const sorted = [...list].sort((x, y) => x.data.getTime() - y.data.getTime());
  return { azienda: a, items: sorted };
}

export function useRiepilogoPdf(filters: RiepilogoFilters): UseRiepilogoPdfResult {
  const { aziende, attivita } = useRepositories();
  const { aziendaId, fromStr, toStr } = filters;
  const enabled = aziendaId !== "";

  const query = useQuery<RiepilogoData>({
    queryKey: queryKeys.riepilogoPdf(aziendaId, fromStr || null, toStr || null),
    queryFn: () => loadRiepilogo(aziendaId, fromStr, toStr, aziende, attivita),
    enabled,
  });

  const error: "not-found" | "load-failed" | null = !enabled
    ? "not-found"
    : query.isError
      ? "load-failed"
      : query.isSuccess && query.data.azienda === null
        ? "not-found"
        : null;

  const summary = useMemo<RiepilogoSummary | null>(() => {
    const data = query.data;
    if (!data || !data.azienda) return null;
    const total = data.items.reduce((s, a) => s + a.totale, 0);
    return {
      azienda: data.azienda,
      items: data.items,
      total,
      from: parseDateInput(fromStr),
      to: parseDateInput(toStr),
      vetName: data.items[0]?.ownerName ?? "",
    };
  }, [query.data, fromStr, toStr]);

  const generatePdf = useCallback(() => {
    window.print();
  }, []);

  const shareWhatsApp = useCallback(() => {
    if (!summary) return;
    const lines = summary.items.map(
      (a) => `${formatDate(a.data)} · ${a.tipoNome} · ${formatEuro(a.totale)}`
    );
    const text = encodeURIComponent(
      `Riepilogo ${summary.azienda.nome}\n\n${lines.join("\n")}\n\nTotale: ${formatEuro(summary.total)}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener");
  }, [summary]);

  const loading = enabled && query.isLoading;

  return {
    loading,
    isLoading: loading,
    isError: query.isError,
    error,
    summary,
    generatePdf,
    shareWhatsApp,
  };
}
