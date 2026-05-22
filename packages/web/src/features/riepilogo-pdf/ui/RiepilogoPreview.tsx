import { formatDate, formatEuro } from "../../attivita/lib/format";
import { riepilogoI18n as t } from "../i18n";
import type { RiepilogoSummary } from "../hooks/useRiepilogoPdf";

interface RiepilogoPreviewProps {
  summary: RiepilogoSummary;
}

export function RiepilogoPreview({ summary }: RiepilogoPreviewProps) {
  const { azienda, items, total, from, to, vetName } = summary;
  return (
    <div className="bg-(--color-surface) border border-(--color-border) rounded-2xl p-10 print:border-0 print:rounded-none print:p-0 print:bg-white">
      <header className="border-b border-(--color-border) pb-5 mb-5">
        <div className="flex items-baseline justify-between">
          <div>
            <h1 className="text-3xl text-(--color-text)">Veterinario</h1>
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
          <p className="text-(--color-text) font-medium mt-1">{azienda.nome}</p>
          {azienda.indirizzo ? (
            <p className="text-(--color-text-muted) text-xs mt-1">{azienda.indirizzo}</p>
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
            {from ? formatDate(from) : "—"}
            {" → "}
            {to ? formatDate(to) : "—"}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-(--color-text-muted) py-8 text-center">{t.noData}</p>
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
                <td className="py-2 text-right tabular-nums">{formatEuro(a.totale)}</td>
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
        {t.veterinario}: {vetName || "—"}
      </footer>
    </div>
  );
}
