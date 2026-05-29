import { attivitaI18n as t } from "../i18n";
import { formatEuro } from "../../../shared/lib/format";
import type { computeTotals } from "../lib/totals";

const countFormatter = new Intl.NumberFormat("it-IT");

export function AttivitaTotalsBar({
  totals,
}: {
  totals: ReturnType<typeof computeTotals>;
}) {
  return (
    <dl
      aria-live="polite"
      className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-4 rounded-lg border border-(--color-border) bg-(--color-surface) px-4 py-2.5 text-sm"
    >
      <Pair label={t.totaleRecord} value={countFormatter.format(totals.count)} />
      <Pair label={t.totaleAziende} value={countFormatter.format(totals.aziende)} />
      <Pair label={t.totaleVet} value={countFormatter.format(totals.vets)} />
      <Pair
        label={t.totaleFatturato}
        value={formatEuro(totals.totale)}
        highlight
        grow
      />
    </dl>
  );
}

function Pair({
  label,
  value,
  highlight,
  grow,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  grow?: boolean;
}) {
  return (
    <div
      className={[
        "flex items-baseline gap-1.5 min-w-0",
        grow ? "sm:ml-auto" : "",
      ].join(" ")}
    >
      <dt className="text-(--color-text-muted)">{label}</dt>
      <dd
        className={[
          "tabular-nums text-(--color-text)",
          highlight ? "font-medium" : "",
        ].join(" ")}
      >
        {value}
      </dd>
    </div>
  );
}
