import { useCallback, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button, InlineError, LoadingHint } from "../../../shared/ui";
import { dateInputValue } from "../../../shared/lib/format";
import { defaultPeriodoFor } from "../../conti";
import { riepilogoI18n as t } from "../i18n";
import { useRiepilogoPdf } from "../hooks/useRiepilogoPdf";
import { RiepilogoFilters } from "./RiepilogoFilters";
import { RiepilogoPreview } from "./RiepilogoPreview";

export function RiepilogoPdfPage() {
  const { id } = useParams<{ id: string }>();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const fromStr = params.get("from") ?? "";
  const toStr = params.get("to") ?? "";
  const includeBilled = params.get("fatturate") === "1";

  const setIncludeBilled = useCallback(
    (next: boolean) => {
      const params2 = new URLSearchParams(params);
      if (next) params2.set("fatturate", "1");
      else params2.delete("fatturate");
      setParams(params2, { replace: true });
    },
    [params, setParams]
  );

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
    includeBilled,
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
        <LoadingHint />
      </main>
    );
  }

  if (error || !summary) {
    return (
      <RiepilogoStatus
        message={error === "load-failed" ? t.loadError : t.notFound}
        onBack={() => navigate(-1)}
      />
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
          includeBilled={includeBilled}
          onIncludeBilledChange={setIncludeBilled}
          {...(summary.azienda.cadenzaFatturazione
            ? { cadenza: summary.azienda.cadenzaFatturazione }
            : {})}
        />
        <RiepilogoPreview summary={summary} />
      </div>
    </main>
  );
}

interface RiepilogoStatusProps {
  message: string;
  onBack: () => void;
}

function RiepilogoStatus({ message, onBack }: RiepilogoStatusProps) {
  return (
    <main className="min-h-screen bg-(--color-background) p-10">
      <div className="mx-auto flex max-w-md flex-col items-start gap-4">
        <InlineError>{message}</InlineError>
        <Button type="button" variant="secondary" onClick={onBack}>
          {t.back}
        </Button>
      </div>
    </main>
  );
}
