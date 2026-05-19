import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog } from "../../shared/ui";
import { useRepositories } from "../../infrastructure/RepositoriesContext";
import { useAuthState } from "../auth";
import type { Attivita, Azienda } from "@vet/shared";

export function SearchPalette() {
  const navigate = useNavigate();
  const { user } = useAuthState();
  const { aziende, attivita } = useRepositories();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Azienda[]>([]);
  const [recentAtt, setRecentAtt] = useState<Attivita[]>([]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      const calls: Promise<void>[] = [];
      if (user?.caps.has("aziende.read")) {
        calls.push(
          aziende.list().then((list) => {
            if (!cancelled) setItems(list);
          })
        );
      }
      if (user?.caps.has("activities.read.all")) {
        calls.push(
          attivita.list().then((list) => {
            if (!cancelled) setRecentAtt(list.slice(0, 50));
          })
        );
      }
      await Promise.all(calls);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, aziende, attivita, user]);

  const filteredAziende = useMemo(() => {
    if (!query.trim()) return items.slice(0, 6);
    const q = query.toLowerCase();
    return items
      .filter(
        (a) =>
          a.nomeNorm.includes(q) ||
          a.nome.toLowerCase().includes(q) ||
          (a.telefono ?? "").includes(q)
      )
      .slice(0, 8);
  }, [query, items]);

  const filteredAtt = useMemo(() => {
    if (!query.trim()) return [] as Attivita[];
    const q = query.toLowerCase();
    return recentAtt
      .filter(
        (a) =>
          a.aziendaNome.toLowerCase().includes(q) ||
          a.tipoNome.toLowerCase().includes(q) ||
          (a.note ?? "").toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [query, recentAtt]);

  const totalResults = filteredAziende.length + filteredAtt.length;

  return (
    <Dialog open={open} onClose={() => setOpen(false)} size="lg" className="overflow-hidden">
        <input
          type="text"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca un'azienda…"
          className="w-full bg-transparent px-5 py-4 text-base text-(--color-text) placeholder:text-(--color-text-subtle) focus:outline-none border-b border-(--color-border)"
        />
          {totalResults === 0 ? (
            <p className="text-sm text-(--color-text-muted) text-center py-8">
              Nessun risultato.
            </p>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {filteredAziende.length > 0 ? (
                <>
                  <p className="px-5 pt-3 pb-1 text-[10px] uppercase tracking-wider text-(--color-text-muted)">
                    Aziende
                  </p>
                  <ul>
                    {filteredAziende.map((a) => (
                      <li key={a.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setOpen(false);
                            setQuery("");
                            navigate(`/aziende/${a.id}`);
                          }}
                          className="w-full text-left px-5 py-3 hover:bg-(--color-surface-muted) flex items-center justify-between gap-3"
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
                </>
              ) : null}
              {filteredAtt.length > 0 ? (
                <>
                  <p className="px-5 pt-3 pb-1 text-[10px] uppercase tracking-wider text-(--color-text-muted) border-t border-(--color-border)/40">
                    Attività
                  </p>
                  <ul>
                    {filteredAtt.map((a) => (
                      <li key={a.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setOpen(false);
                            setQuery("");
                            navigate(`/attivita/${a.id}`);
                          }}
                          className="w-full text-left px-5 py-3 hover:bg-(--color-surface-muted) flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="text-sm text-(--color-text) truncate">
                              {a.aziendaNome} · {a.tipoNome}
                            </p>
                            <p className="text-xs text-(--color-text-muted) truncate tabular-nums">
                              {a.data.toLocaleDateString("it-IT")}
                            </p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </div>
          )}
        <div className="px-5 py-2 bg-(--color-surface-muted) text-xs text-(--color-text-subtle) text-right">
          <kbd className="px-1.5 py-0.5 rounded bg-(--color-surface) border border-(--color-border) font-mono">
            ⌘K
          </kbd>{" "}
          apre ·{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-(--color-surface) border border-(--color-border) font-mono">
            Esc
          </kbd>{" "}
          chiude
        </div>
    </Dialog>
  );
}
