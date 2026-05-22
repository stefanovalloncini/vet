import { useCallback, useEffect, useMemo, useState } from "react";
import type { Attivita, Azienda } from "@vet/shared";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { formatDate, formatEuro, parseDateInput } from "../../attivita/lib/format";

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
  generatePdf: () => void;
  shareWhatsApp: () => void;
}

export function useRiepilogoPdf(filters: RiepilogoFilters): UseRiepilogoPdfResult {
  const { aziende, attivita } = useRepositories();
  const [azienda, setAzienda] = useState<Azienda | null>(null);
  const [items, setItems] = useState<Attivita[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<"not-found" | "load-failed" | null>(null);

  const { aziendaId, fromStr, toStr } = filters;

  useEffect(() => {
    if (!aziendaId) {
      setLoading(false);
      setError("not-found");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const a = await aziende.getById(aziendaId);
        if (cancelled) return;
        if (!a) {
          setAzienda(null);
          setItems([]);
          setError("not-found");
          setLoading(false);
          return;
        }
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
        if (cancelled) return;
        setAzienda(a);
        setItems(list.sort((x, y) => x.data.getTime() - y.data.getTime()));
        setLoading(false);
      } catch {
        if (cancelled) return;
        setError("load-failed");
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [aziendaId, fromStr, toStr, aziende, attivita]);

  const summary = useMemo<RiepilogoSummary | null>(() => {
    if (!azienda) return null;
    const total = items.reduce((s, a) => s + a.totale, 0);
    return {
      azienda,
      items,
      total,
      from: parseDateInput(fromStr),
      to: parseDateInput(toStr),
      vetName: items[0]?.ownerName ?? "",
    };
  }, [azienda, items, fromStr, toStr]);

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

  return { loading, error, summary, generatePdf, shareWhatsApp };
}
