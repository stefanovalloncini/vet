import { useCallback, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { dateInputValue } from "../../../shared/lib/format";
import { defaultPeriodoFor } from "../../conti";
import { useRiepilogoPdf } from "../hooks/useRiepilogoPdf";
import { RiepilogoFilters } from "./RiepilogoFilters";
import { RiepilogoPreview } from "./RiepilogoPreview";

export function RiepilogoPdfPage() {
  const { id } = useParams<{ id: string }>();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const fromStr = params.get("from") ?? "";
  const toStr = params.get("to") ?? "";

  const setPeriod = useCallback(
    (key: "from" | "to", value: string) => {
      const next = new URLSearchParams(params);
      if (value) next.set(key, value);
      else next.delete(key);
      setParams(next, { replace: true });
    },
    [params, setParams]
  );

  const setPeriodRange = useCallback(
    (from: Date, to: Date) => {
      const next = new URLSearchParams(params);
      next.set("from", dateInputValue(from));
      next.set("to", dateInputValue(to));
      setParams(next, { replace: true });
    },
    [params, setParams]
  );

  const { loading, error, summary, generatePdf, shareWhatsApp } = useRiepilogoPdf({
    aziendaId: id ?? "",
    fromStr,
    toStr,
  });

  useEffect(() => {
    if (fromStr || toStr) return;
    const azienda = summary?.azienda;
    if (!azienda) return;
    const defaults = defaultPeriodoFor(azienda);
    setPeriodRange(defaults.from, defaults.to);
  }, [summary?.azienda, fromStr, toStr, setPeriodRange]);

  if (loading) {
    return (
      <main className="min-h-screen bg-(--color-background) p-10">
        <p className="text-sm text-(--color-text-muted)">Caricamento…</p>
      </main>
    );
  }

  if (error === "not-found" || !summary) {
    return (
      <main className="min-h-screen bg-(--color-background) p-10">
        <p className="text-sm text-(--color-danger)">Cliente non trovato.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-(--color-background)">
      <div className="max-w-3xl mx-auto py-8 px-4 sm:py-10 sm:px-6">
        <RiepilogoFilters
          onBack={() => navigate(-1)}
          onPrint={() => void generatePdf()}
          onShareWhatsApp={shareWhatsApp}
          canShare={summary.items.length > 0}
          from={fromStr}
          to={toStr}
          onPeriodChange={setPeriod}
          onPeriodRange={setPeriodRange}
          {...(summary.azienda.cadenzaFatturazione
            ? { cadenza: summary.azienda.cadenzaFatturazione }
            : {})}
        />
        <RiepilogoPreview summary={summary} />
      </div>
    </main>
  );
}
