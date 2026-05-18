import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../shared/ui";
import { useRepositories } from "../../infrastructure/RepositoriesContext";
import { useAuthState } from "../auth";
import type { Azienda } from "@vet/shared";

export function SearchPalette() {
  const navigate = useNavigate();
  const { user } = useAuthState();
  const { aziende } = useRepositories();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Azienda[]>([]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open || !user?.caps.has("aziende.read")) return;
    let cancelled = false;
    void (async () => {
      const list = await aziende.list();
      if (!cancelled) setItems(list);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, aziende, user]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items.slice(0, 8);
    const q = query.toLowerCase();
    return items
      .filter(
        (a) =>
          a.nomeNorm.includes(q) ||
          a.nome.toLowerCase().includes(q) ||
          (a.telefono ?? "").includes(q)
      )
      .slice(0, 12);
  }, [query, items]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 pt-24"
      onClick={() => setOpen(false)}
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg">
        <Card elevated padded={false} className="overflow-hidden">
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca un'azienda…"
            className="w-full bg-transparent px-5 py-4 text-base text-(--color-text) placeholder:text-(--color-text-subtle) focus:outline-none border-b border-(--color-border)"
          />
          {filtered.length === 0 ? (
            <p className="text-sm text-(--color-text-muted) text-center py-8">
              Nessun risultato.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {filtered.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      setQuery("");
                      navigate(`/aziende/${a.id}`);
                    }}
                    className="w-full text-left px-5 py-3 hover:bg-(--color-surface-muted) flex items-center justify-between gap-3 border-b border-(--color-border)/40 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-(--color-text) truncate">
                        {a.nome}
                      </p>
                      {a.indirizzo ? (
                        <p className="text-xs text-(--color-text-muted) truncate">
                          {a.indirizzo}
                        </p>
                      ) : null}
                    </div>
                    {a.numeroCapi !== undefined ? (
                      <span className="text-xs text-(--color-text-subtle) tabular-nums flex-shrink-0">
                        {a.numeroCapi} capi
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="px-5 py-2 bg-(--color-surface-muted) text-xs text-(--color-text-subtle) text-right">
            <kbd className="px-1.5 py-0.5 rounded bg-(--color-surface) border border-(--color-border) font-mono">
              ⌘K
            </kbd>{" "}
            apre · <kbd className="px-1.5 py-0.5 rounded bg-(--color-surface) border border-(--color-border) font-mono">Esc</kbd> chiude
          </div>
        </Card>
      </div>
    </div>
  );
}
