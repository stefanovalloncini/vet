import { Card, SectionLabel } from "../../../shared/ui";
import { formatEuro } from "../../../shared/lib/format";
import { dashboardI18n as t } from "../i18n";
import type { TipoBreakdownRow } from "../hooks/useDashboardStats";

interface TipoBreakdownPanelProps {
  rows: ReadonlyArray<TipoBreakdownRow>;
  total: number;
  className?: string;
}

export function TipoBreakdownPanel({ rows, total, className = "" }: TipoBreakdownPanelProps) {
  return (
    <Card className={className}>
      <SectionLabel as="span" className="mb-3 block">
        {t.tipiTitle}
      </SectionLabel>
      {rows.length === 0 ? (
        <p className="text-sm text-(--color-text-muted)">{t.tipiEmpty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-(--color-text) border-b border-(--color-border-strong)">
                <th scope="col" className="py-2 pr-3 font-medium">{t.tipiColTipo}</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">{t.tipiColCount}</th>
                <th scope="col" className="py-2 text-right font-medium">{t.tipiColTotale}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-(--color-border)/60 last:border-b-0 hover:bg-(--color-surface-muted) transition-colors"
                >
                  <td className="py-2 pr-3 align-top text-(--color-text) max-w-[28ch] truncate">
                    {r.nome}
                  </td>
                  <td className="py-2 pr-3 align-top text-right tabular-nums text-(--color-text-muted)">
                    {r.count}
                  </td>
                  <td className="py-2 align-top text-right tabular-nums font-medium text-(--color-text)">
                    {formatEuro(r.total)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-(--color-border) text-(--color-text) font-medium">
                <td className="py-2 pr-3">{t.tipiFooter}</td>
                <td className="py-2 pr-3" />
                <td className="py-2 text-right tabular-nums">{formatEuro(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </Card>
  );
}
