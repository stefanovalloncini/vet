import { Link } from "react-router-dom";
import type { Attivita } from "@vet/shared";
import { Card, SectionLabel } from "../../../shared/ui";
import { formatDate, formatEuro } from "../../../shared/lib/format";
import { routes } from "../../../routes";
import { dashboardI18n as t } from "../i18n";

interface RecentActivitiesPanelProps {
  items: ReadonlyArray<Attivita>;
  className?: string;
}

export function RecentActivitiesPanel({ items, className = "" }: RecentActivitiesPanelProps) {
  return (
    <Card className={className}>
      <SectionLabel as="span" className="mb-3 block">
        {t.recentTitle}
      </SectionLabel>
      {items.length === 0 ? (
        <p className="text-sm text-(--color-text-muted)">{t.recentEmpty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-(--color-text) border-b border-(--color-border-strong)">
                <th scope="col" className="py-2 pr-3 font-medium">{t.recentColData}</th>
                <th scope="col" className="py-2 pr-3 font-medium">{t.recentColAzienda}</th>
                <th scope="col" className="py-2 pr-3 font-medium">{t.recentColTipo}</th>
                <th scope="col" className="py-2 text-right font-medium">{t.recentColTotale}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-(--color-border)/60 last:border-b-0 hover:bg-(--color-surface-muted) transition-colors"
                >
                  <td className="py-2 pr-3 align-top whitespace-nowrap tabular-nums text-(--color-text-muted)">
                    <Link
                      to={routes.attivitaEdit.to({ id: a.id })}
                      className="block rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-1"
                    >
                      {formatDate(a.data)}
                    </Link>
                  </td>
                  <td className="py-2 pr-3 align-top text-(--color-text) font-medium max-w-[18ch] truncate">
                    {a.aziendaNome}
                  </td>
                  <td className="py-2 pr-3 align-top text-(--color-text-muted) max-w-[16ch] truncate">
                    {a.tipoNome}
                  </td>
                  <td className="py-2 align-top text-right tabular-nums font-medium text-(--color-text)">
                    {formatEuro(a.totale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
