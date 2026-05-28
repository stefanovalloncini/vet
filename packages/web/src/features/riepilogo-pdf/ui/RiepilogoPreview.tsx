import { formatDate, formatEuro } from "../../../shared/lib/format";
import { riepilogoI18n as t } from "../i18n";
import type { Attivita } from "@vet/shared";
import type { RiepilogoSummary } from "../hooks/useRiepilogoPdf";

interface RiepilogoPreviewProps {
  summary: RiepilogoSummary;
}

const oreFormatter = new Intl.NumberFormat("it-IT", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function formatOre(value: number | undefined): string {
  if (value === undefined) return "—";
  return oreFormatter.format(value);
}

function formatTariffa(a: Attivita): string {
  if (a.tariffa === 0) return "—";
  return formatEuro(a.tariffa);
}

export function RiepilogoPreview({ summary }: RiepilogoPreviewProps) {
  const { azienda, items, total, from, to, vetName } = summary;
  const issuedAt = new Date();

  return (
    <article className="riepilogo-doc bg-(--color-surface) border border-(--color-border) rounded-2xl p-8 sm:p-10 print:border-0 print:rounded-none print:p-0 print:bg-white print:text-black font-sans">
      <header className="flex items-start justify-between gap-6 pb-6 mb-8 border-b border-(--color-border) print:border-black/40">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-(--color-text) print:text-black">
            Riepilogo prestazioni
          </h1>
          <p className="text-xs mt-1.5 text-(--color-text-muted) print:text-black/60">
            {t.documento}
          </p>
        </div>
        <div className="text-right text-xs text-(--color-text-muted) print:text-black/60">
          <p className="uppercase tracking-wider">Emesso il</p>
          <p className="mt-1 tabular-nums text-(--color-text) print:text-black">
            {formatDate(issuedAt)}
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 text-sm">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-(--color-text-muted) print:text-black/60">
            {t.cliente}
          </p>
          <p className="text-base font-medium mt-1.5 text-(--color-text) print:text-black break-words">
            {azienda.nome}
          </p>
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
          {azienda.emailFatturazione ? (
            <p className="text-xs mt-1 text-(--color-text-muted) print:text-black/60">
              {azienda.emailFatturazione}
            </p>
          ) : null}
        </div>
        <div className="sm:text-right">
          <p className="text-[10px] uppercase tracking-wider text-(--color-text-muted) print:text-black/60">
            {t.periodo}
          </p>
          <p className="text-base mt-1.5 tabular-nums text-(--color-text) print:text-black">
            {from ? formatDate(from) : "—"} → {to ? formatDate(to) : "—"}
          </p>
          <p className="text-xs mt-1 text-(--color-text-muted) print:text-black/60">
            {items.length} {items.length === 1 ? "prestazione" : "prestazioni"}
          </p>
        </div>
      </section>

      {items.length === 0 ? (
        <p className="text-sm py-12 text-center text-(--color-text-muted) print:text-black/60">
          {t.noData}
        </p>
      ) : (
        <div className="overflow-x-auto print:overflow-visible">
        <table className="w-full min-w-[34rem] text-sm border-collapse">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-(--color-text-muted) print:text-black/60 border-b-2 border-(--color-border) print:border-black/50">
              <th scope="col" className="text-left py-2.5 pr-3 w-[88px]">
                {t.data}
              </th>
              <th scope="col" className="text-left py-2.5 pr-3">
                {t.tipo}
              </th>
              <th scope="col" className="text-left py-2.5 pr-3">
                {t.note}
              </th>
              <th scope="col" className="text-right py-2.5 pr-3 w-[56px]">
                {t.ore}
              </th>
              <th scope="col" className="text-right py-2.5 pr-3 w-[90px]">
                {t.tariffa}
              </th>
              <th scope="col" className="text-right py-2.5 w-[100px]">
                {t.totale}
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr
                key={a.id}
                className="border-b border-(--color-border)/60 print:border-black/15 break-inside-avoid align-top"
              >
                <td className="py-2.5 pr-3 tabular-nums text-(--color-text) print:text-black">
                  {formatDate(a.data)}
                </td>
                <td className="py-2.5 pr-3 text-(--color-text) print:text-black">
                  {a.tipoNome}
                </td>
                <td className="py-2.5 pr-3 text-xs text-(--color-text-muted) print:text-black/70 leading-snug max-w-[260px] break-words">
                  {a.note ?? ""}
                </td>
                <td className="py-2.5 pr-3 text-right tabular-nums text-(--color-text) print:text-black">
                  {formatOre(a.ore)}
                </td>
                <td className="py-2.5 pr-3 text-right tabular-nums text-(--color-text) print:text-black">
                  {formatTariffa(a)}
                </td>
                <td className="py-2.5 text-right tabular-nums font-medium text-(--color-text) print:text-black">
                  {formatEuro(a.totale)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td
                colSpan={5}
                className="pt-5 text-right text-[11px] uppercase tracking-wider text-(--color-text-muted) print:text-black/70"
              >
                {t.totale}
              </td>
              <td className="pt-5 text-right tabular-nums text-xl font-semibold text-(--color-text) print:text-black">
                {formatEuro(total)}
              </td>
            </tr>
          </tfoot>
        </table>
        </div>
      )}

      <footer className="mt-12 pt-5 border-t border-(--color-border) print:border-black/30 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 print:grid-cols-2 text-[11px] text-(--color-text-subtle) print:text-black/55">
        <div className="min-w-0">
          <p className="uppercase tracking-wider text-(--color-text-muted) print:text-black/60">
            {t.veterinario}
          </p>
          <p className="mt-1 text-(--color-text) print:text-black break-words">
            {vetName || "—"}
          </p>
        </div>
        <div className="min-w-0 sm:text-right print:text-right">
          <p>
            Documento generato il {formatDate(issuedAt)} ·{" "}
            <span className="tabular-nums">
              {issuedAt.toLocaleTimeString("it-IT", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </p>
          <p className="mt-1 break-words">gestionale.stefanovalloncini.com</p>
        </div>
      </footer>
    </article>
  );
}
