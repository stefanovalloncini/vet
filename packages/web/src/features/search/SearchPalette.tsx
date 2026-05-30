import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Dialog } from "../../shared/ui";
import { useRepositories } from "../../infrastructure/RepositoriesContext";
import { useAuthState } from "../auth";
import { queryKeys } from "../../shared/data";
import type { Attivita, Azienda } from "@vet/shared";
import { filterAziende, filterAttivita } from "./lib/filter";

export const SEARCH_OPEN_EVENT = "vet:search:open";

export function openSearch(): void {
  window.dispatchEvent(new CustomEvent(SEARCH_OPEN_EVENT));
}

export function SearchPalette() {
  const navigate = useNavigate();
  const { user } = useAuthState();
  const { aziende, attivita } = useRepositories();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const canReadAziende = user?.caps.has("aziende.read") ?? false;
  const canReadAttivita = user?.caps.has("activities.read.all") ?? false;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    function onOpenRequested() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener(SEARCH_OPEN_EVENT, onOpenRequested);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(SEARCH_OPEN_EVENT, onOpenRequested);
    };
  }, []);

  const aziendeQ = useQuery({
    queryKey: queryKeys.aziende,
    queryFn: () => aziende.list(),
    enabled: open && canReadAziende,
  });

  const attivitaQ = useQuery({
    queryKey: queryKeys.attivita(),
    queryFn: () => attivita.list(),
    enabled: open && canReadAttivita,
  });

  const items = useMemo(() => aziendeQ.data ?? [], [aziendeQ.data]);
  const recentAtt = useMemo<Attivita[]>(
    () => (attivitaQ.data ?? []).slice(0, 50),
    [attivitaQ.data]
  );

  const filteredAziende = useMemo(
    () => filterAziende(items, query),
    [query, items]
  );

  const filteredAtt = useMemo(
    () => filterAttivita(recentAtt, query),
    [query, recentAtt]
  );

  const totalResults = filteredAziende.length + filteredAtt.length;
  const hasQuery = query.trim().length > 0;

  function closeAndReset(): void {
    setOpen(false);
    setQuery("");
  }

  function go(path: string): void {
    closeAndReset();
    navigate(path);
  }

  return (
    <Dialog
      open={open}
      onClose={closeAndReset}
      size="lg"
      labelledBy="search-palette-label"
      className="overflow-hidden"
    >
      <h2 id="search-palette-label" className="sr-only">
        Cerca
      </h2>
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-(--color-border)">
        <Search
          size={18}
          className="text-(--color-text-subtle) flex-shrink-0"
          aria-hidden="true"
        />
        <input
          type="text"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca un'azienda…"
          className="flex-1 min-w-0 bg-transparent text-base text-(--color-text) placeholder:text-(--color-text-subtle) focus:outline-none"
          aria-label="Cerca"
          role="combobox"
          aria-expanded={totalResults > 0}
          aria-controls="search-palette-results"
          aria-autocomplete="list"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="search"
        />
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {hasQuery
          ? totalResults === 0
            ? "Nessun risultato"
            : `${totalResults} risultati`
          : ""}
      </p>

      {totalResults === 0 ? (
        <EmptyResults hasQuery={hasQuery} />
      ) : (
        <ul
          id="search-palette-results"
          role="listbox"
          aria-label="Risultati"
          className="max-h-96 overflow-y-auto overscroll-contain py-1"
        >
          {filteredAziende.length > 0 ? (
            <ResultGroup title="Aziende">
              {filteredAziende.map((a) => (
                <AziendaResult
                  key={a.id}
                  azienda={a}
                  onSelect={() => go(`/aziende/${a.id}`)}
                />
              ))}
            </ResultGroup>
          ) : null}
          {filteredAtt.length > 0 ? (
            <ResultGroup title="Attività" divided>
              {filteredAtt.map((a) => (
                <AttivitaResult
                  key={a.id}
                  attivita={a}
                  onSelect={() => go(`/attivita/${a.id}`)}
                />
              ))}
            </ResultGroup>
          ) : null}
        </ul>
      )}

      <div className="flex items-center justify-end gap-3 px-4 py-2 bg-(--color-surface-muted) text-xs text-(--color-text-subtle)">
        <span className="inline-flex items-center gap-1">
          <Kbd>⌘K</Kbd>
          apre
        </span>
        <span aria-hidden="true">·</span>
        <span className="inline-flex items-center gap-1">
          <Kbd>Esc</Kbd>
          chiude
        </span>
      </div>
    </Dialog>
  );
}

interface EmptyResultsProps {
  hasQuery: boolean;
}

function EmptyResults({ hasQuery }: EmptyResultsProps) {
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
  children: React.ReactNode;
}

function ResultGroup({ title, divided = false, children }: ResultGroupProps) {
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

function AziendaResult({ azienda: a, onSelect }: AziendaResultProps) {
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

function AttivitaResult({ attivita: a, onSelect }: AttivitaResultProps) {
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
            {a.data.toLocaleDateString("it-IT")}
          </span>
        </span>
      </button>
    </li>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="px-1.5 py-0.5 rounded bg-(--color-surface) border border-(--color-border) font-mono">
      {children}
    </kbd>
  );
}
