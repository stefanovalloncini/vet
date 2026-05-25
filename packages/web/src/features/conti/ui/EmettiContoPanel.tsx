import { useMemo, useState } from "react";
import type { Attivita, Azienda } from "@vet/shared";
import { Button, Card, ConfirmDialog, SectionLabel, TextField, useToast } from "../../../shared/ui";
import { useAuthState } from "../../auth";
import { dateInputValue, formatEuro, parseDateInput } from "../../../shared/lib/format";
import { useEmettiConto } from "../hooks/useConti";
import { contiI18n as t } from "../i18n";
import {
  computeContoPreview,
  defaultPeriodoFor,
} from "../lib/contoPreview";

interface EmettiContoPanelProps {
  azienda: Azienda;
  items: ReadonlyArray<Attivita>;
}

export function EmettiContoPanel({ azienda, items }: EmettiContoPanelProps) {
  const { user } = useAuthState();
  const { notify } = useToast();
  const emit = useEmettiConto();
  const defaults = useMemo(() => defaultPeriodoFor(azienda), [azienda]);
  const [from, setFrom] = useState(() => dateInputValue(defaults.from));
  const [to, setTo] = useState(() => dateInputValue(defaults.to));
  const [confirmingEmit, setConfirmingEmit] = useState(false);

  const fromDate = parseDateInput(from);
  const toDate = parseDateInput(to);
  const periodValid =
    !!fromDate && !!toDate && fromDate.getTime() <= toDate.getTime();

  const preview = useMemo(() => {
    if (!periodValid || !fromDate || !toDate) {
      return { attivitaIds: [], totaleConto: 0, count: 0 };
    }
    const endOfDay = new Date(toDate);
    endOfDay.setHours(23, 59, 59, 999);
    return computeContoPreview(items, azienda.id, fromDate, endOfDay);
  }, [items, azienda.id, fromDate, toDate, periodValid]);

  const canProforma = user?.caps.has("conti.proforma") ?? false;
  const canEmit = user?.caps.has("conti.emit") ?? false;

  if (!canProforma && !canEmit) return null;

  async function doEmit(modalita: "proforma" | "emesso"): Promise<void> {
    if (!user || !fromDate || !toDate || preview.count === 0) return;
    const endOfDay = new Date(toDate);
    endOfDay.setHours(23, 59, 59, 999);
    try {
      await emit.mutateAsync({
        input: {
          aziendaId: azienda.id,
          periodoFrom: fromDate,
          periodoTo: endOfDay,
          modalita,
        },
        denorm: {
          aziendaNome: azienda.nome,
          attivitaIds: preview.attivitaIds,
          totaleConto: preview.totaleConto,
        },
        actor: user,
      });
      notify(
        modalita === "proforma"
          ? "Pro forma generato"
          : "Conto emesso e aggiunto ai pagamenti",
        "success"
      );
    } catch {
      notify("Salvataggio non riuscito", "error");
    }
  }

  return (
    <Card>
      <SectionLabel>{t.emit}</SectionLabel>
      <div className="grid grid-cols-2 gap-3 mt-3">
        <TextField
          id="conto-from"
          type="date"
          label={t.daLabel}
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <TextField
          id="conto-to"
          type="date"
          label={t.aLabel}
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
      </div>
      <div className="flex items-baseline justify-between pt-4 border-t border-(--color-border) mt-4">
        <span className="text-xs text-(--color-text-muted) uppercase tracking-wider">
          {t.attivita}: {preview.count} · {t.totale}
        </span>
        <span className="text-xl font-medium text-(--color-text) tabular-nums">
          {formatEuro(preview.totaleConto)}
        </span>
      </div>
      {!periodValid ? (
        <p className="text-xs text-(--color-danger) mt-3">
          Il periodo finale deve essere dopo l&apos;iniziale.
        </p>
      ) : null}
      {preview.count === 0 && periodValid ? (
        <p className="text-xs text-(--color-text-muted) mt-3">{t.noActivities}</p>
      ) : null}
      <div className="flex flex-wrap gap-2 mt-4">
        {canProforma ? (
          <Button
            type="button"
            variant="secondary"
            disabled={!periodValid || preview.count === 0 || emit.isPending}
            onClick={() => void doEmit("proforma")}
          >
            {t.emitProforma}
          </Button>
        ) : null}
        {canEmit ? (
          <Button
            type="button"
            variant="primary"
            disabled={!periodValid || preview.count === 0 || emit.isPending}
            onClick={() => setConfirmingEmit(true)}
          >
            {t.emit}
          </Button>
        ) : null}
      </div>
      <ConfirmDialog
        open={confirmingEmit}
        title={t.emit}
        message={t.confermaEmessi}
        confirmLabel={t.emetti}
        cancelLabel={t.annulla}
        busy={emit.isPending}
        onConfirm={async () => {
          await doEmit("emesso");
          setConfirmingEmit(false);
        }}
        onClose={() => {
          if (emit.isPending) return;
          setConfirmingEmit(false);
        }}
      />
    </Card>
  );
}

