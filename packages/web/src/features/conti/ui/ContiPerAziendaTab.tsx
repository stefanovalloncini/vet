import { useState } from "react";
import type { Conto } from "@vet/shared";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  LoadingHint,
} from "../../../shared/ui";
import { formatDate, formatEuro } from "../../../shared/lib/format";
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
  if (conti.length === 0) return <EmptyState title={t.emptyAll} />;
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

function ContoSummaryRow({ conto }: { conto: Conto }) {
  const { user } = useAuthState();
  const saldo = useSaldaConto();
  const [busy, setBusy] = useState(false);
  const canSaldare = user?.caps.has("conti.saldo") ?? false;
  const isEmesso = conto.modalita === "emesso";
  const period = `${formatDate(conto.periodoFrom)} – ${formatDate(conto.periodoTo)}`;
  const status = statusFor(conto);
  const showSaldoAction = isEmesso && !conto.saldato && canSaldare;

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Badge tone={status.tone} dot />
            <Badge tone={status.tone}>{status.label}</Badge>
          </div>
          <p className="mt-2 text-base text-(--color-text)">{period}</p>
          <p className="mt-1 text-xs text-(--color-text-subtle)">
            {t.emessoIl} {formatDate(conto.emittedAt)} · {t.attivita}:{" "}
            {conto.attivitaIds.length}
          </p>
        </div>
        <div className="flex flex-row items-center justify-between gap-3 sm:flex-col sm:items-end">
          <span className="font-mono text-lg font-medium text-(--color-text) tabular-nums">
            {formatEuro(conto.totaleConto)}
          </span>
          {showSaldoAction ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={busy || saldo.isPending}
              onClick={() => void quickSaldo()}
            >
              {t.segnaSaldato}
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
