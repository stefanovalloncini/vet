import { Link } from "react-router-dom";
import { Pencil, ArchiveX, ExternalLink } from "lucide-react";
import { Button } from "../../../shared/ui";
import { routes } from "../../../routes";
import type { Azienda } from "@vet/shared";
import { BackToAziende } from "./BackToAziende";

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
      <BackToAziende />
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-(--color-text) break-words text-balance">
            {azienda.nome}
          </h1>
          {azienda.indirizzo ? (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(azienda.indirizzo)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex max-w-full items-center gap-1 rounded text-sm text-(--color-text-muted) transition-colors duration-(--motion-fast) hover:text-(--color-accent) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-2"
            >
              <span className="min-w-0 break-words">{azienda.indirizzo}</span>
              <ExternalLink
                size={13}
                strokeWidth={1.75}
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              />
            </a>
          ) : null}
        </div>
        {canEdit ? (
          <div className="flex shrink-0 items-center gap-2">
            <Link to={routes.aziendaEdit.to({ id: azienda.id })}>
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
