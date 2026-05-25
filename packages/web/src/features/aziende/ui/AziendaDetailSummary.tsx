import { Link } from "react-router-dom";
import { Pencil, ArchiveX } from "lucide-react";
import { Button } from "../../../shared/ui";
import type { Azienda } from "@vet/shared";

interface AziendaDetailSummaryProps {
  azienda: Azienda;
  canEdit: boolean;
  onArchive?: () => void;
}

export function AziendaDetailSummary({
  azienda,
  canEdit,
  onArchive,
}: AziendaDetailSummaryProps) {
  return (
    <header className="mb-8">
      <Link
        to="/aziende"
        className="text-sm text-(--color-text-muted) hover:text-(--color-text) transition-colors duration-(--motion-fast) inline-flex items-center gap-1.5"
      >
        <span aria-hidden="true">←</span>
        <span>Aziende</span>
      </Link>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-(--color-text) break-words">
            {azienda.nome}
          </h1>
          {azienda.indirizzo ? (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(azienda.indirizzo)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-(--color-text-muted) hover:text-(--color-accent) mt-1.5 inline-flex items-center gap-1 transition-colors duration-(--motion-fast)"
            >
              <span>{azienda.indirizzo}</span>
              <span aria-hidden="true">↗</span>
            </a>
          ) : null}
        </div>
        {canEdit ? (
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to={`/aziende/${azienda.id}/modifica`}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leadingIcon={<Pencil size={14} strokeWidth={1.75} aria-hidden="true" />}
              >
                Modifica
              </Button>
            </Link>
            {onArchive ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                leadingIcon={<ArchiveX size={14} strokeWidth={1.75} aria-hidden="true" />}
                onClick={onArchive}
              >
                Archivia
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </header>
  );
}
