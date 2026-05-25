import { Link } from "react-router-dom";
import type { Attivita } from "@vet/shared";
import { formatDate, formatEuro } from "../../../shared/lib/format";
import { attivitaI18n as t } from "../i18n";
import type { Group } from "../lib/totals";

const COLGROUP = (
  <colgroup>
    <col className="w-[110px]" />
    <col />
    <col />
    <col className="w-[64px]" />
    <col className="w-[100px]" />
    <col className="w-[110px]" />
  </colgroup>
);

const HEADER_ROW = (
  <tr className="text-left text-xs uppercase tracking-wider text-(--color-text-muted) border-b border-(--color-border)">
    <th className="py-2 pr-3 font-medium">{t.colData}</th>
    <th className="py-2 pr-3 font-medium">{t.colAzienda}</th>
    <th className="py-2 pr-3 font-medium">{t.colTipo}</th>
    <th className="py-2 pr-3 font-medium text-right">{t.colOre}</th>
    <th className="py-2 pr-3 font-medium text-right">{t.colTariffa}</th>
    <th className="py-2 font-medium text-right">{t.colTotale}</th>
  </tr>
);

export function AttivitaTableFlat({ items }: { items: ReadonlyArray<Attivita> }) {
  return (
    <table className="w-full text-sm border-collapse">
      {COLGROUP}
      <thead>{HEADER_ROW}</thead>
      <tbody>
        {items.map((a) => (
          <AttivitaTr key={a.id} attivita={a} />
        ))}
      </tbody>
    </table>
  );
}

export function AttivitaTableGrouped({ groups }: { groups: ReadonlyArray<Group> }) {
  return (
    <table className="w-full text-sm border-collapse">
      {COLGROUP}
      <thead>{HEADER_ROW}</thead>
      {groups.map((g) => (
        <tbody key={g.key} className="border-b border-(--color-border) last:border-b-0">
          <tr>
            <td colSpan={5} className="pt-5 pb-2 text-sm font-semibold text-(--color-text)">
              {g.label}
            </td>
            <td className="pt-5 pb-2 text-right text-sm font-semibold text-(--color-text) tabular-nums">
              {formatEuro(g.totale)}
            </td>
          </tr>
          {g.items.map((a) => (
            <AttivitaTr key={a.id} attivita={a} />
          ))}
        </tbody>
      ))}
    </table>
  );
}

function AttivitaTr({ attivita: a }: { attivita: Attivita }) {
  return (
    <tr className="border-b border-(--color-border)/60 last:border-b-0 hover:bg-(--color-surface-muted) transition-colors">
      <td className="py-2.5 pr-3 align-top tabular-nums text-(--color-text-muted)">
        <Link
          to={`/attivita/${a.id}`}
          className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-1 rounded"
        >
          {formatDate(a.data)}
        </Link>
      </td>
      <td className="py-2.5 pr-3 align-top">
        <Link
          to={`/attivita/${a.id}`}
          className="block text-(--color-text) font-medium hover:text-(--color-accent) transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-1 rounded"
        >
          {a.aziendaNome}
        </Link>
        <span className="block text-xs text-(--color-text-subtle) mt-0.5">
          {a.ownerName}
        </span>
      </td>
      <td className="py-2.5 pr-3 align-top text-(--color-text)">
        {a.tipoNome}
        {a.note ? (
          <span className="block text-xs text-(--color-text-subtle) mt-0.5 truncate max-w-[28ch]">
            {a.note}
          </span>
        ) : null}
      </td>
      <td className="py-2.5 pr-3 align-top text-right tabular-nums text-(--color-text-muted)">
        {a.oraria && a.ore !== undefined ? a.ore : "—"}
      </td>
      <td className="py-2.5 pr-3 align-top text-right tabular-nums text-(--color-text-muted)">
        {formatEuro(a.tariffa)}
      </td>
      <td className="py-2.5 align-top text-right tabular-nums font-medium text-(--color-text)">
        {formatEuro(a.totale)}
      </td>
    </tr>
  );
}
