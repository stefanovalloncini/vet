import type { ReactNode } from "react";
import type { Attivita, Azienda } from "@vet/shared";
import { formatDate } from "../../shared/lib/format";

interface EmptyResultsProps {
  hasQuery: boolean;
}

export function EmptyResults({ hasQuery }: EmptyResultsProps) {
  return (
    <div id="search-palette-results" className="py-10 px-5 text-center">
      <p className="text-sm text-(--color-text-muted)">Nessun risultato.</p>
      {!hasQuery ? (
        <p className="text-xs text-(--color-text-subtle) mt-1">
          Cerca aziende per nome, telefono o indirizzo.
        </p>
      ) : null}
    </div>
  );
}

interface ResultGroupProps {
  title: string;
  divided?: boolean;
  children: ReactNode;
}

export function ResultGroup({ title, divided = false, children }: ResultGroupProps) {
  return (
    <li
      role="group"
      aria-label={title}
      className={divided ? "mt-1 border-t border-(--color-border)/60" : ""}
    >
      <p
        aria-hidden="true"
        className="px-5 pt-3 pb-1 text-[10px] uppercase tracking-wider font-medium text-(--color-text-muted)"
      >
        {title}
      </p>
      <ul role="presentation">{children}</ul>
    </li>
  );
}

interface AziendaResultProps {
  azienda: Azienda;
  onSelect: () => void;
}

export function AziendaResult({ azienda: a, onSelect }: AziendaResultProps) {
  return (
    <li role="presentation">
      <button
        type="button"
        role="option"
        aria-selected={false}
        onClick={onSelect}
        className="w-full text-left px-5 py-3 min-h-11 hover:bg-(--color-surface-muted) flex items-center justify-between gap-3 focus:outline-none focus-visible:-outline-offset-2 focus-visible:bg-(--color-surface-muted)"
      >
        <span className="min-w-0">
          <span className="block text-sm font-medium text-(--color-text) truncate">
            {a.nome}
          </span>
          {a.indirizzo ? (
            <span className="block text-xs text-(--color-text-muted) truncate">
              {a.indirizzo}
            </span>
          ) : null}
        </span>
        {a.numeroCapi !== undefined ? (
          <span className="text-xs text-(--color-text-subtle) tabular-nums flex-shrink-0">
            {a.numeroCapi} capi
          </span>
        ) : null}
      </button>
    </li>
  );
}

interface AttivitaResultProps {
  attivita: Attivita;
  onSelect: () => void;
}

export function AttivitaResult({ attivita: a, onSelect }: AttivitaResultProps) {
  return (
    <li role="presentation">
      <button
        type="button"
        role="option"
        aria-selected={false}
        onClick={onSelect}
        className="w-full text-left px-5 py-3 min-h-11 hover:bg-(--color-surface-muted) flex items-center justify-between gap-3 focus:outline-none focus-visible:-outline-offset-2 focus-visible:bg-(--color-surface-muted)"
      >
        <span className="min-w-0">
          <span className="block text-sm text-(--color-text) truncate">
            {a.aziendaNome} · {a.tipoNome}
          </span>
          <span className="block text-xs text-(--color-text-muted) truncate font-mono tabular-nums">
            {formatDate(a.data)}
          </span>
        </span>
      </button>
    </li>
  );
}
