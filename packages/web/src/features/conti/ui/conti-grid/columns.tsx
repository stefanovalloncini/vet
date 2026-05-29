import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Badge } from "../../../../shared/ui";
import type { Column } from "../../../../shared/ui/data-grid";
import { formatDate, formatEuro } from "../../../../shared/lib/format";
import { routes } from "../../../../routes";
import { contiI18n as t } from "../../i18n";
import { sumDovuto, type ContoRow } from "../../lib/buildContiRows";

function aziendaHref(id: string): string {
  return `${routes.aziendaDetail.to({ id })}?tab=conti`;
}

function StatoCell({ row }: { row: ContoRow }): ReactNode {
  const unsaldati = row.bucket.hasUnsaldati;
  return (
    <Badge
      tone={unsaldati ? "danger" : "success"}
      size="sm"
      dot
      aria-label={unsaldati ? t.contiNonSaldatiDot : t.contiTuttiSaldatiDot}
    >
      {unsaldati ? t.statoNonSaldato : t.statoSaldato}
    </Badge>
  );
}

export function buildContiColumns(): ReadonlyArray<Column<ContoRow>> {
  return [
    {
      id: "azienda",
      header: t.colAzienda,
      sortable: true,
      accessor: (r) => r.azienda.nomeNorm,
      cell: (r) => (
        <Link
          to={aziendaHref(r.azienda.id)}
          className="block max-w-[28ch] truncate font-medium text-(--color-text) hover:text-(--color-accent) transition-colors focus:outline-none focus-visible:underline"
          title={r.azienda.nome}
        >
          {r.azienda.nome}
        </Link>
      ),
    },
    {
      id: "ultimo",
      header: t.colUltimoConto,
      tone: "muted",
      width: 130,
      sortable: true,
      accessor: (r) => r.bucket.lastEmittedAt.getTime(),
      cell: (r) => (
        <span className="tabular-nums">{formatDate(r.bucket.lastEmittedAt)}</span>
      ),
    },
    {
      id: "numConti",
      header: t.colNumConti,
      tone: "muted",
      align: "end",
      width: 90,
      sortable: true,
      accessor: (r) => r.bucket.conti.length,
    },
    {
      id: "nonSaldati",
      header: t.colNonSaldati,
      align: "end",
      width: 110,
      sortable: true,
      accessor: (r) => r.bucket.unsaldatiCount,
    },
    {
      id: "dovuto",
      header: t.colTotaleDovuto,
      align: "end",
      width: 150,
      sortable: true,
      accessor: (r) => r.bucket.totaleUnsaldati,
      cell: (r) =>
        r.bucket.hasUnsaldati ? (
          <span className="font-medium text-(--color-danger)">
            {formatEuro(r.bucket.totaleUnsaldati)}
          </span>
        ) : (
          <span className="text-(--color-text-subtle)">{formatEuro(0)}</span>
        ),
      footer: (rows) => <span>{formatEuro(sumDovuto(rows))}</span>,
    },
    {
      id: "stato",
      header: t.colStato,
      sortable: false,
      width: 132,
      accessor: (r) => (r.bucket.hasUnsaldati ? t.statoNonSaldato : t.statoSaldato),
      cell: (r) => <StatoCell row={r} />,
    },
  ];
}

export function contoCard(row: ContoRow): ReactNode {
  const { azienda, bucket } = row;
  return (
    <Link
      to={aziendaHref(azienda.id)}
      className="flex items-center justify-between gap-3 rounded-lg border border-(--color-border) bg-(--color-surface) px-4 py-3 transition-colors hover:border-(--color-border-strong) focus:outline-none focus-visible:border-(--color-accent)"
    >
      <div className="min-w-0 flex-1">
        <span className="block truncate font-medium text-(--color-text)" title={azienda.nome}>
          {azienda.nome}
        </span>
        <span className="mt-1 block">
          <StatoCell row={row} />
        </span>
      </div>
      <span
        className={[
          "shrink-0 tabular-nums font-medium",
          bucket.hasUnsaldati ? "text-(--color-danger)" : "text-(--color-text-subtle)",
        ].join(" ")}
      >
        {formatEuro(bucket.totaleUnsaldati)}
      </span>
    </Link>
  );
}
