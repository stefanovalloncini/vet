import { useMemo } from "react";
import type { Conto } from "@vet/shared";
import { Badge, Card, EmptyState } from "../../../shared/ui";
import { DataGrid, dataGridIt, type Column, type RowAction } from "../../../shared/ui/data-grid";
import { formatDate, formatEuro } from "../../../shared/lib/format";
import { useContiForAzienda, useSaldaConto } from "../hooks/useConti";
import { contiI18n as t } from "../i18n";
import { useAuthState } from "../../auth";

interface ContiPerAziendaTabProps {
  aziendaId: string;
}

interface StatusMeta {
  tone: "success" | "danger" | "warning";
  label: string;
}

function statusFor(conto: Conto): StatusMeta {
  if (conto.modalita !== "emesso") {
    return { tone: "warning", label: t.proforma };
  }
  return conto.saldato
    ? { tone: "success", label: t.saldato }
    : { tone: "danger", label: t.nonSaldato };
}

const COLUMNS: ReadonlyArray<Column<Conto>> = [
  {
    id: "periodo",
    header: "Periodo",
    accessor: (c) => c.periodoFrom.getTime(),
    sortable: true,
    cell: (c) => `${formatDate(c.periodoFrom)} – ${formatDate(c.periodoTo)}`,
  },
  {
    id: "totale",
    header: "Totale",
    accessor: (c) => c.totaleConto,
    sortable: true,
    align: "end",
    width: 120,
    cell: (c) => formatEuro(c.totaleConto),
  },
  {
    id: "stato",
    header: "Stato",
    accessor: (c) => (c.modalita !== "emesso" ? "proforma" : c.saldato ? "saldato" : "non-saldato"),
    filterId: "stato",
    cell: (c) => {
      const status = statusFor(c);
      return (
        <Badge tone={status.tone} dot>
          {status.label}
        </Badge>
      );
    },
  },
];

export function ContiPerAziendaTab({ aziendaId }: ContiPerAziendaTabProps) {
  const { user } = useAuthState();
  const query = useContiForAzienda(aziendaId);
  const conti = useMemo(() => query.data ?? [], [query.data]);
  const saldo = useSaldaConto();
  const canSaldare = user?.caps.has("conti.saldo") ?? false;

  const rowActions: ReadonlyArray<RowAction<Conto>> = useMemo(() => {
    if (!canSaldare) return [];
    return [
      {
        id: "salda",
        label: t.segnaSaldato,
        tone: "primary",
        visible: (c) => c.modalita === "emesso" && !c.saldato,
        disabled: () => saldo.isPending,
        onClick: (c) => {
          if (!user) return;
          void saldo.mutateAsync({
            input: { contoId: c.id, importoSaldato: c.totaleConto },
            actor: user,
          });
        },
      },
    ];
  }, [canSaldare, saldo, user]);

  return (
    <DataGrid<Conto>
      rows={conti}
      columns={COLUMNS}
      getRowId={(c) => c.id}
      mode="responsive"
      i18n={dataGridIt}
      loading={query.isPending}
      error={query.isError ? "load-failed" : null}
      rowActions={rowActions}
      card={(c, { actions }) => <ContoCard conto={c} actions={actions} />}
      emptyState={<EmptyState title={t.emptyAll} />}
    />
  );
}

interface ContoCardProps {
  conto: Conto;
  actions: ReadonlyArray<RowAction<Conto>>;
}

function ContoCard({ conto, actions }: ContoCardProps) {
  const status = statusFor(conto);
  const period = `${formatDate(conto.periodoFrom)} – ${formatDate(conto.periodoTo)}`;
  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <Badge tone={status.tone} dot>
            {status.label}
          </Badge>
          <p className="mt-2 text-base text-(--color-text) tabular-nums">
            {period}
          </p>
          <p className="mt-1 text-xs text-(--color-text-subtle) tabular-nums">
            {t.emessoDa} {conto.emittedByName} il {formatDate(conto.emittedAt)} ·{" "}
            {t.attivita}: {conto.attivitaIds.length}
          </p>
          {conto.saldato && conto.saldatoByName ? (
            <p className="mt-0.5 text-xs text-(--color-text-subtle) tabular-nums">
              {t.saldatoDa} {conto.saldatoByName}
              {conto.saldatoAt ? ` il ${formatDate(conto.saldatoAt)}` : ""}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-row items-center justify-between gap-3 sm:flex-col sm:items-end">
          <span className="font-mono text-lg font-medium text-(--color-text) tabular-nums whitespace-nowrap">
            {formatEuro(conto.totaleConto)}
          </span>
          {actions.map((action) => {
            const visible = action.visible ? action.visible(conto) : true;
            if (!visible) return null;
            const isDisabled = action.disabled ? action.disabled(conto) : false;
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => action.onClick(conto)}
                disabled={isDisabled}
                className={[
                  "inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-medium whitespace-nowrap",
                  "transition-[background-color,opacity] duration-(--motion-fast) ease-(--ease-out-quart)",
                  "bg-(--color-accent) text-white hover:bg-(--color-accent-hover)",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-2",
                  "active:scale-[0.97] motion-reduce:active:scale-100",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
                ].join(" ")}
              >
                {action.label}
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
