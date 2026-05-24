import { useMemo, useState } from "react";
import {
  AppShell,
  Button,
  Card,
  EmptyState,
  InlineError,
  LoadingHint,
  PageHeader,
} from "../../../shared/ui";
import { useAuthState } from "../../auth";
import { useAziende } from "../../aziende/hooks/useAziende";
import { useAttivita } from "../../attivita/hooks/useAttivita";
import { usePayments } from "../hooks/usePayments";
import { computeArrears, type AziendaArrears } from "../lib/arrears";
import { paymentsI18n as t } from "../i18n";
import { formatEuro } from "../../attivita/lib/format";
import { PaymentDialog } from "./PaymentDialog";
import type { Azienda, Payment } from "@vet/shared";

const EMPTY_AZIENDE: Azienda[] = [];
const EMPTY_PAYMENTS: Payment[] = [];

export function PaymentsPage() {
  const { user } = useAuthState();
  const aziendeQuery = useAziende();
  const attivitaQuery = useAttivita();
  const paymentsQuery = usePayments();
  const aziende = aziendeQuery.data ?? EMPTY_AZIENDE;
  const attivita = attivitaQuery.items;
  const payments = paymentsQuery.data ?? EMPTY_PAYMENTS;
  const loading =
    aziendeQuery.isPending ||
    attivitaQuery.loading ||
    paymentsQuery.isPending;
  const error =
    aziendeQuery.isError || attivitaQuery.isError || paymentsQuery.isError
      ? "load-failed"
      : null;
  const [paying, setPaying] = useState<AziendaArrears | null>(null);

  const canManage = user?.caps.has("payments.manage") ?? false;

  const arrears = useMemo(
    () => computeArrears(aziende, attivita, payments).sort(byArrearsDesc),
    [aziende, attivita, payments]
  );

  return (
    <AppShell>
      <PageHeader title={t.title} subtitle={t.subtitle} />

      {loading ? (
        <LoadingHint label={t.loading} />
      ) : error ? (
        <InlineError>{t.loadError}</InlineError>
      ) : aziende.length === 0 ? (
        <EmptyState title={t.emptyAziende} />
      ) : (
        <ul className="space-y-2">
          {arrears.map((row) => (
            <li key={row.azienda.id}>
              <PaymentRow
                row={row}
                canManage={canManage}
                onMark={() => setPaying(row)}
              />
            </li>
          ))}
        </ul>
      )}

      {paying ? (
        <PaymentDialog
          row={paying}
          onClose={() => setPaying(null)}
          onSaved={() => setPaying(null)}
        />
      ) : null}
    </AppShell>
  );
}

function byArrearsDesc(a: AziendaArrears, b: AziendaArrears): number {
  if (a.unpaidTotal === b.unpaidTotal) return b.daysOverdue - a.daysOverdue;
  return b.unpaidTotal - a.unpaidTotal;
}

function PaymentRow({
  row,
  canManage,
  onMark,
}: {
  row: AziendaArrears;
  canManage: boolean;
  onMark: () => void;
}) {
  const inRegola = row.unpaidCount === 0;
  const severe = !inRegola && row.daysOverdue >= 60;
  return (
    <Card
      className={[
        "transition-colors",
        severe ? "border-(--color-danger)/40" : "hover:border-(--color-border-strong)",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-medium text-(--color-text) truncate">
            {row.azienda.nome}
          </h2>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
            {row.lastPayment ? (
              <span className="text-(--color-text-muted)">
                {t.pagatoFinoA} {row.lastPayment.periodoFinoA.toLocaleDateString("it-IT")}
              </span>
            ) : (
              <span className="text-(--color-text-subtle)">Nessun pagamento registrato</span>
            )}
            {inRegola ? (
              <span className="px-2 py-0.5 rounded-md bg-(--color-accent-soft) text-(--color-text)">
                {t.inRegola}
              </span>
            ) : (
              <span
                className={[
                  "px-2 py-0.5 rounded-md",
                  severe
                    ? "bg-(--color-danger)/10 text-(--color-danger)"
                    : "bg-(--color-surface-muted) text-(--color-text-muted)",
                ].join(" ")}
              >
                {row.daysOverdue} {t.giorniArretrato}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span
            className={[
              "text-lg font-medium tabular-nums",
              inRegola ? "text-(--color-text-muted)" : "text-(--color-text)",
            ].join(" ")}
          >
            {formatEuro(row.unpaidTotal)}
          </span>
          {canManage ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onMark}
            >
              {t.segnaPagato}
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
