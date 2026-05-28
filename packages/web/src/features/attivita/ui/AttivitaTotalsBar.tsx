import { SectionLabel } from "../../../shared/ui";
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
      className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 mb-8"
    >
      <Stat label={t.totaleRecord} value={countFormatter.format(totals.count)} />
      <Stat label={t.totaleAziende} value={countFormatter.format(totals.aziende)} />
      <Stat label={t.totaleVet} value={countFormatter.format(totals.vets)} />
      <Stat
        label={t.totaleFatturato}
        value={formatEuro(totals.totale)}
        highlight
      />
    </dl>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="min-w-0">
      <SectionLabel as="dt">{label}</SectionLabel>
      <dd
        className={[
          "tabular-nums mt-1 break-words",
          highlight
            ? "text-xl font-medium text-(--color-text)"
            : "text-base text-(--color-text)",
        ].join(" ")}
      >
        {value}
      </dd>
    </div>
  );
}
