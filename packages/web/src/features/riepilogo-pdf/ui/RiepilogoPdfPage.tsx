import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "../../../shared/ui";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { riepilogoI18n as t } from "../i18n";
import {
  formatDate,
  formatEuro,
  parseDateInput,
} from "../../attivita/lib/format";
import type { Attivita, Azienda } from "@vet/shared";

export function RiepilogoPdfPage() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { aziende, attivita } = useRepositories();

  const fromStr = params.get("from") ?? "";
  const toStr = params.get("to") ?? "";

  const [loading, setLoading] = useState(true);
  const [azienda, setAzienda] = useState<Azienda | null>(null);
  const [items, setItems] = useState<Attivita[]>([]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void (async () => {
      const a = await aziende.getById(id);
      if (cancelled) return;
      setAzienda(a);
      const filters: { aziendaId: string; from?: Date; to?: Date } = {
        aziendaId: id,
      };
      const fromD = parseDateInput(fromStr);
      const toD = parseDateInput(toStr);
      if (fromD) filters.from = fromD;
      if (toD) {
        const end = new Date(toD);
        end.setHours(23, 59, 59, 999);
        filters.to = end;
      }
      const list = await attivita.list(filters);
      if (cancelled) return;
      setItems(list.sort((x, y) => x.data.getTime() - y.data.getTime()));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, fromStr, toStr, aziende, attivita]);

  const total = useMemo(() => items.reduce((s, a) => s + a.totale, 0), [items]);

  if (loading) {
    return (
      <main className="min-h-screen bg-(--color-background) p-10">
        <p className="text-sm text-(--color-text-muted)">Caricamento…</p>
      </main>
    );
  }

  if (!azienda) {
    return (
      <main className="min-h-screen bg-(--color-background) p-10">
        <p className="text-sm text-(--color-danger)">Cliente non trovato.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-(--color-background)">
      <div className="max-w-3xl mx-auto py-10 px-6">
        <div className="flex items-center justify-between mb-8 print:hidden gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-sm text-(--color-text-muted) hover:text-(--color-text)"
          >
            ← {t.back}
          </button>
          <div className="flex items-center gap-2">
            {items.length > 0 ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  const lines = items.map(
                    (a) =>
                      `${formatDate(a.data)} · ${a.tipoNome} · ${formatEuro(a.totale)}`
                  );
                  const text = encodeURIComponent(
                    `Riepilogo ${azienda?.nome ?? ""}\n\n${lines.join("\n")}\n\nTotale: ${formatEuro(total)}`
                  );
                  window.open(`https://wa.me/?text=${text}`, "_blank", "noopener");
                }}
              >
                WhatsApp
              </Button>
            ) : null}
            <Button
              type="button"
              variant="primary"
              onClick={() => window.print()}
            >
              {t.stampa}
            </Button>
          </div>
        </div>

        <div className="bg-(--color-surface) border border-(--color-border) rounded-2xl p-10 print:border-0 print:rounded-none print:p-0 print:bg-white">
          <header className="border-b border-(--color-border) pb-5 mb-5">
            <div className="flex items-baseline justify-between">
              <div>
                <h1 className="text-3xl text-(--color-text)">
                  Studio Marinoni
                </h1>
                <p className="text-xs text-(--color-text-muted) mt-1">
                  Veterinaria per allevamenti
                </p>
              </div>
              <span className="text-xs text-(--color-text-subtle) uppercase tracking-wider">
                {t.documento}
              </span>
            </div>
          </header>

          <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wider text-(--color-text-muted)">
                {t.cliente}
              </p>
              <p className="text-(--color-text) font-medium mt-1">
                {azienda.nome}
              </p>
              {azienda.indirizzo ? (
                <p className="text-(--color-text-muted) text-xs mt-1">
                  {azienda.indirizzo}
                </p>
              ) : null}
              {azienda.piva ? (
                <p className="text-(--color-text-muted) text-xs mt-1">
                  {t.partitaIva}: {azienda.piva}
                </p>
              ) : null}
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-(--color-text-muted)">
                {t.periodo}
              </p>
              <p className="text-(--color-text) mt-1">
                {fromStr && parseDateInput(fromStr)
                  ? formatDate(parseDateInput(fromStr)!)
                  : "—"}
                {" → "}
                {toStr && parseDateInput(toStr)
                  ? formatDate(parseDateInput(toStr)!)
                  : "—"}
              </p>
            </div>
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-(--color-text-muted) py-8 text-center">
              {t.noData}
            </p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-(--color-border) text-(--color-text-muted) text-xs uppercase tracking-wider">
                  <th className="text-left py-2">{t.data}</th>
                  <th className="text-left py-2">{t.tipo}</th>
                  <th className="text-right py-2">{t.importo}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a.id} className="border-b border-(--color-border)/50">
                    <td className="py-2 tabular-nums">{formatDate(a.data)}</td>
                    <td className="py-2 text-(--color-text-muted)">
                      {a.tipoNome}
                      {a.note ? (
                        <span className="block text-xs text-(--color-text-subtle) mt-0.5">
                          {a.note}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {formatEuro(a.totale)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2} className="pt-4 font-medium text-(--color-text)">
                    {t.totale}
                  </td>
                  <td className="pt-4 text-right tabular-nums font-medium text-lg text-(--color-text)">
                    {formatEuro(total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}

          <footer className="mt-10 pt-5 border-t border-(--color-border) text-xs text-(--color-text-subtle)">
            {t.veterinario}: {items[0]?.ownerName ?? "—"}
          </footer>
        </div>
      </div>
    </main>
  );
}
