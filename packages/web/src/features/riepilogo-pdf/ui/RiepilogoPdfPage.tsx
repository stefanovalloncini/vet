import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useRiepilogoPdf } from "../hooks/useRiepilogoPdf";
import { RiepilogoFilters } from "./RiepilogoFilters";
import { RiepilogoPreview } from "./RiepilogoPreview";

export function RiepilogoPdfPage() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const fromStr = params.get("from") ?? "";
  const toStr = params.get("to") ?? "";

  const { loading, error, summary, generatePdf, shareWhatsApp } = useRiepilogoPdf({
    aziendaId: id ?? "",
    fromStr,
    toStr,
  });

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
      <div className="max-w-3xl mx-auto py-10 px-6">
        <RiepilogoFilters
          onBack={() => navigate(-1)}
          onPrint={generatePdf}
          onShareWhatsApp={shareWhatsApp}
          canShare={summary.items.length > 0}
        />
        <RiepilogoPreview summary={summary} />
      </div>
    </main>
  );
}
