import { SectionLabel } from "../../../shared/ui";
import { attivitaI18n as t } from "../i18n";
import { formatEuro } from "../../../shared/lib/format";
import type { computeTotals } from "../lib/totals";

export function AttivitaTotalsBar({
  totals,
}: {
  totals: ReturnType<typeof computeTotals>;
}) {
  return (
    <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 mb-8">
      <Stat label={t.totaleRecord} value={String(totals.count)} />
      <Stat label={t.totaleAziende} value={String(totals.aziende)} />
      <Stat label={t.totaleVet} value={String(totals.vets)} />
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
    <div>
      <SectionLabel as="dt">{label}</SectionLabel>
      <dd
        className={[
          "tabular-nums mt-1",
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
