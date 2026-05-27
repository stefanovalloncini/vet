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
  },
  {
    id: "totale",
    header: "Totale",
    accessor: (c) => c.totaleConto,
    sortable: true,
    align: "end",
  },
  {
    id: "stato",
    header: "Stato",
    accessor: (c) => (c.modalita !== "emesso" ? "proforma" : c.saldato ? "saldato" : "non-saldato"),
    filterId: "stato",
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
      mode="cards"
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
          <div className="flex items-center gap-2">
            <Badge tone={status.tone} dot />
            <Badge tone={status.tone}>{status.label}</Badge>
          </div>
          <p className="mt-2 text-base text-(--color-text)">{period}</p>
          <p className="mt-1 text-xs text-(--color-text-subtle)">
            {t.emessoIl} {formatDate(conto.emittedAt)} · {t.attivita}: {conto.attivitaIds.length}
          </p>
        </div>
        <div className="flex flex-row items-center justify-between gap-3 sm:flex-col sm:items-end">
          <span className="font-mono text-lg font-medium text-(--color-text) tabular-nums">
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
                  "inline-flex items-center justify-center h-9 px-4 text-sm font-medium rounded-xl",
                  "transition-[background-color,opacity] duration-(--motion-fast) ease-(--ease-out-quart)",
                  "bg-(--color-accent) text-white hover:bg-(--color-accent-hover)",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-2",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
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
