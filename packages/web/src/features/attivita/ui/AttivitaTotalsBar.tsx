import { Card } from "../../../shared/ui";
import { attivitaI18n as t } from "../i18n";
import { formatEuro } from "../lib/format";
import type { computeTotals } from "../lib/totals";

export function AttivitaTotalsBar({
  totals,
}: {
  totals: ReturnType<typeof computeTotals>;
}) {
  return (
    <Card className="mb-6">
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        <Stat label={t.totaleRecord} value={String(totals.count)} />
        <Stat label={t.totaleAziende} value={String(totals.aziende)} />
        <Stat label={t.totaleVet} value={String(totals.vets)} />
        <Stat
          label={t.totaleFatturato}
          value={formatEuro(totals.totale)}
          highlight
        />
      </dl>
    </Card>
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
      <dt className="text-xs uppercase tracking-wider text-(--color-text-muted) mb-1">
        {label}
      </dt>
      <dd
        className={[
          "tabular-nums",
          highlight
            ? "text-2xl font-medium text-(--color-text)"
            : "text-lg text-(--color-text)",
        ].join(" ")}
      >
        {value}
      </dd>
    </div>
  );
}
