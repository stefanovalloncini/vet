import { useState } from "react";
import type { Conto } from "@vet/shared";
import { Card, EmptyState, LoadingHint } from "../../../shared/ui";
import { formatEuro } from "../../attivita/lib/format";
import { useContiForAzienda, useSaldaConto } from "../hooks/useConti";
import { contiI18n as t } from "../i18n";
import { useAuthState } from "../../auth";

interface ContiPerAziendaTabProps {
  aziendaId: string;
}

export function ContiPerAziendaTab({ aziendaId }: ContiPerAziendaTabProps) {
  const query = useContiForAzienda(aziendaId);
  const conti = query.data ?? [];
  if (query.isPending) return <LoadingHint label="Caricamento…" />;
  if (conti.length === 0)
    return <EmptyState title={t.emptyAll} />;
  return (
    <ul className="space-y-2">
      {conti.map((c) => (
        <li key={c.id}>
          <ContoSummaryRow conto={c} />
        </li>
      ))}
    </ul>
  );
}

function ContoSummaryRow({ conto }: { conto: Conto }) {
  const { user } = useAuthState();
  const saldo = useSaldaConto();
  const [busy, setBusy] = useState(false);
  const canSaldare = user?.caps.has("conti.saldo") ?? false;
  const isEmesso = conto.modalita === "emesso";
  const period = `${formatDate(conto.periodoFrom)} – ${formatDate(conto.periodoTo)}`;
  const statusLabel = !isEmesso
    ? t.proforma
    : conto.saldato
      ? t.saldato
      : t.nonSaldato;

  async function quickSaldo(): Promise<void> {
    if (!user) return;
    setBusy(true);
    try {
      await saldo.mutateAsync({
        input: { contoId: conto.id, importoSaldato: conto.totaleConto },
        actor: user,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-(--color-text-muted) uppercase tracking-wider">
            {statusLabel}
          </p>
          <p className="text-base text-(--color-text) mt-1">{period}</p>
          <p className="text-[11px] text-(--color-text-subtle) mt-1">
            {t.emessoIl} {formatDate(conto.emittedAt)} ·{" "}
            {t.attivita}: {conto.attivitaIds.length}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-base font-medium text-(--color-text) tabular-nums">
            {formatEuro(conto.totaleConto)}
          </span>
          {isEmesso && !conto.saldato && canSaldare ? (
            <button
              type="button"
              disabled={busy || saldo.isPending}
              onClick={() => void quickSaldo()}
              className="text-xs text-(--color-accent) hover:underline disabled:opacity-50"
            >
              {t.segnaSaldato}
            </button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
