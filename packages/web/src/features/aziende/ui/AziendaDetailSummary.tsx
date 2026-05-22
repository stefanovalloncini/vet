import { Link } from "react-router-dom";
import { Button } from "../../../shared/ui";
import type { Azienda } from "@vet/shared";

interface AziendaDetailSummaryProps {
  azienda: Azienda;
  canEdit: boolean;
  onBack: () => void;
}

export function AziendaDetailSummary({
  azienda,
  canEdit,
  onBack,
}: AziendaDetailSummaryProps) {
  return (
    <header className="mb-6">
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-(--color-text-muted) hover:text-(--color-text) mb-3"
      >
        ← Aziende
      </button>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl text-(--color-text)">{azienda.nome}</h1>
          {azienda.indirizzo ? (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(azienda.indirizzo)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-(--color-text-muted) hover:text-(--color-accent) mt-1 inline-block"
            >
              {azienda.indirizzo} ↗
            </a>
          ) : null}
        </div>
        {canEdit ? (
          <Link to={`/aziende/${azienda.id}/modifica`}>
            <Button type="button" variant="secondary">
              Modifica
            </Button>
          </Link>
        ) : null}
      </div>
    </header>
  );
}
