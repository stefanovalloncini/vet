import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Attivita, Azienda } from "@vet/shared";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { queryKeys } from "../../../shared/data/queryClient";
import { formatDate, formatEuro, parseDateInput } from "../../../shared/lib/format";
import { RiepilogoDocument, downloadPdf, openWhatsappShare } from "../../../shared/pdf";

function riepilogoFilenameStem(summary: RiepilogoSummary): string {
  const parts = ["riepilogo", summary.azienda.nomeNorm || "azienda"];
  if (summary.from) parts.push(yyyymmdd(summary.from));
  if (summary.to) parts.push(yyyymmdd(summary.to));
  return parts.join("_");
}

function yyyymmdd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

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
  error: "not-found" | "load-failed" | null;
  summary: RiepilogoSummary | null;
  generatePdf: () => Promise<void>;
  shareWhatsApp: () => void;
}

interface FetchedDetail {
  azienda: Azienda | null;
  items: Attivita[];
}

export function useRiepilogoPdf(filters: RiepilogoFilters): UseRiepilogoPdfResult {
  const { aziende, attivita } = useRepositories();
  const { aziendaId, fromStr, toStr } = filters;
  const fromKey = fromStr || null;
  const toKey = toStr || null;

  const query = useQuery<FetchedDetail>({
    queryKey: queryKeys.riepilogoPdf(aziendaId || "__none__", fromKey, toKey),
    enabled: aziendaId !== "",
    queryFn: async () => {
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
      return {
        azienda: a,
        items: list.sort((x, y) => x.data.getTime() - y.data.getTime()),
      };
    },
  });

  const error: "not-found" | "load-failed" | null = useMemo(() => {
    if (!aziendaId) return "not-found";
    if (query.isError) return "load-failed";
    if (query.isSuccess && query.data.azienda === null) return "not-found";
    return null;
  }, [aziendaId, query.isError, query.isSuccess, query.data]);

  const summary = useMemo<RiepilogoSummary | null>(() => {
    const data = query.data;
    if (!data?.azienda) return null;
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

  const generatePdf = useCallback(async () => {
    if (!summary) return;
    const filenameStem = riepilogoFilenameStem(summary);
    await downloadPdf(
      <RiepilogoDocument
        data={{
          azienda: summary.azienda,
          righe: summary.items,
          periodo: { from: summary.from, to: summary.to },
          emessoIl: new Date(),
          vetName: summary.vetName,
          totale: summary.total,
        }}
      />,
      filenameStem
    );
  }, [summary]);

  const shareWhatsApp = useCallback(() => {
    if (!summary) return;
    const lines = summary.items.map(
      (a) => `${formatDate(a.data)} · ${a.tipoNome} · ${formatEuro(a.totale)}`
    );
    const text =
      `Riepilogo ${summary.azienda.nome}\n\n${lines.join("\n")}\n\nTotale: ${formatEuro(summary.total)}`;
    openWhatsappShare({ text });
  }, [summary]);

  const loading = aziendaId !== "" && query.isLoading;

  return { loading, error, summary, generatePdf, shareWhatsApp };
}
