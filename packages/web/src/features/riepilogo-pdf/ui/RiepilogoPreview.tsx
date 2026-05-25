import { formatDate, formatEuro } from "../../../shared/lib/format";
import { riepilogoI18n as t } from "../i18n";
import type { RiepilogoSummary } from "../hooks/useRiepilogoPdf";

interface RiepilogoPreviewProps {
  summary: RiepilogoSummary;
}

export function RiepilogoPreview({ summary }: RiepilogoPreviewProps) {
  const { azienda, items, total, from, to, vetName } = summary;
  const issuedAt = new Date();
  return (
    <article className="riepilogo-doc bg-(--color-surface) border border-(--color-border) rounded-2xl p-10 print:border-0 print:rounded-none print:p-12 print:bg-white print:text-black">
      <header className="flex items-start justify-between gap-6 pb-6 mb-6 border-b border-(--color-border) print:border-black/30">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Veterinario</h1>
          <p className="text-xs mt-1 text-(--color-text-muted) print:text-black/60">
            Servizi veterinari per allevamenti
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wider text-(--color-text-muted) print:text-black/60">
            {t.documento}
          </p>
          <p className="text-xs tabular-nums mt-1 text-(--color-text-muted) print:text-black/60">
            Emesso il {formatDate(issuedAt)}
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 text-sm">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-(--color-text-muted) print:text-black/60">
            {t.cliente}
          </p>
          <p className="text-base font-medium mt-1.5">{azienda.nome}</p>
          {azienda.indirizzo ? (
            <p className="text-xs mt-1 text-(--color-text-muted) print:text-black/60">
              {azienda.indirizzo}
            </p>
          ) : null}
          {azienda.piva ? (
            <p className="text-xs mt-1 text-(--color-text-muted) print:text-black/60 tabular-nums">
              {t.partitaIva}: {azienda.piva}
            </p>
          ) : null}
        </div>
        <div className="sm:text-right">
          <p className="text-[10px] uppercase tracking-wider text-(--color-text-muted) print:text-black/60">
            {t.periodo}
          </p>
          <p className="text-base mt-1.5 tabular-nums">
            {from ? formatDate(from) : "—"} → {to ? formatDate(to) : "—"}
          </p>
          <p className="text-xs mt-1 text-(--color-text-muted) print:text-black/60">
            {items.length} {items.length === 1 ? "prestazione" : "prestazioni"}
          </p>
        </div>
      </section>

      {items.length === 0 ? (
        <p className="text-sm py-12 text-center text-(--color-text-muted)">
          {t.noData}
        </p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-(--color-border) print:border-black/40 text-[10px] uppercase tracking-wider text-(--color-text-muted) print:text-black/60">
              <th className="text-left py-2 w-[110px]">{t.data}</th>
              <th className="text-left py-2">{t.tipo}</th>
              <th className="text-right py-2 w-[110px]">{t.importo}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr
                key={a.id}
                className="border-b border-(--color-border)/60 print:border-black/15 break-inside-avoid"
              >
                <td className="py-2.5 align-top tabular-nums">
                  {formatDate(a.data)}
                </td>
                <td className="py-2.5 align-top">
                  <span className="text-(--color-text) print:text-black">{a.tipoNome}</span>
                  {a.note ? (
                    <span className="block text-xs mt-0.5 text-(--color-text-subtle) print:text-black/55">
                      {a.note}
                    </span>
                  ) : null}
                </td>
                <td className="py-2.5 align-top text-right tabular-nums">
                  {formatEuro(a.totale)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td
                colSpan={2}
                className="pt-5 text-[11px] uppercase tracking-wider text-(--color-text-muted) print:text-black/60"
              >
                {t.totale}
              </td>
              <td className="pt-5 text-right tabular-nums text-2xl font-semibold">
                {formatEuro(total)}
              </td>
            </tr>
          </tfoot>
        </table>
      )}

      <footer className="mt-12 pt-5 border-t border-(--color-border) print:border-black/30 grid grid-cols-2 gap-6 text-xs text-(--color-text-subtle) print:text-black/55">
        <div>
          <p className="uppercase tracking-wider text-(--color-text-muted) print:text-black/60">
            {t.veterinario}
          </p>
          <p className="mt-1 text-(--color-text) print:text-black">{vetName || "—"}</p>
        </div>
        <div className="text-right">
          <p>
            Documento generato il {formatDate(issuedAt)} ·{" "}
            <span className="tabular-nums">
              {issuedAt.toLocaleTimeString("it-IT", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </p>
          <p className="mt-1">gestionale.stefanovalloncini.com</p>
        </div>
      </footer>
    </article>
  );
}
