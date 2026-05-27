import { useMemo, useState } from "react";
import type { Attivita, Azienda } from "@vet/shared";
import {
  Button,
  Card,
  ConfirmDialog,
  SectionLabel,
  TextField,
  Toolbar,
  useToast,
} from "../../../shared/ui";
import { useAuthState } from "../../auth";
import {
  dateInputValue,
  formatEuro,
  parseDateInput,
} from "../../../shared/lib/format";
import { useEmettiConto } from "../hooks/useConti";
import { contiI18n as t } from "../i18n";
import { computeContoPreview, defaultPeriodoFor } from "../lib/contoPreview";
import {
  ContoDocument,
  ProformaDocument,
  downloadPdf,
} from "../../../shared/pdf";

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
    const includedAttivita = items.filter((a) =>
      preview.attivitaIds.includes(a.id)
    );
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
        modalita === "proforma" ? "Pro forma generato" : "Conto emesso",
        "success"
      );
      const emessoIl = new Date();
      const periodo = { from: fromDate, to: endOfDay };
      const filenameStem = contoFilenameStem({
        modalita,
        azienda,
        emessoIl,
      });
      if (modalita === "proforma") {
        await downloadPdf(
          <ProformaDocument
            data={{
              azienda,
              righe: includedAttivita,
              periodo,
              emessoIl,
              emessoDa: { uid: user.uid, displayName: user.displayName },
              totale: preview.totaleConto,
            }}
          />,
          filenameStem
        );
      } else {
        await downloadPdf(
          <ContoDocument
            data={{
              azienda,
              righe: includedAttivita,
              periodo,
              emessoIl,
              emessoDa: { uid: user.uid, displayName: user.displayName },
              numero: contoNumeroFor(emessoIl),
              totale: preview.totaleConto,
            }}
          />,
          filenameStem
        );
      }
    } catch {
      // Error toast handled by global mutation handler (meta.errorMessage)
    }
  }

  function contoFilenameStem({
    modalita,
    azienda,
    emessoIl,
  }: {
    modalita: "proforma" | "emesso";
    azienda: Azienda;
    emessoIl: Date;
  }): string {
    const yyyy = emessoIl.getFullYear();
    const mm = String(emessoIl.getMonth() + 1).padStart(2, "0");
    const dd = String(emessoIl.getDate()).padStart(2, "0");
    const stem = modalita === "proforma" ? "proforma" : "conto";
    return `${stem}_${azienda.nomeNorm || "azienda"}_${yyyy}${mm}${dd}`;
  }

  function contoNumeroFor(d: Date): string {
    const yyyy = d.getFullYear();
    const ts = `${d.getMonth() + 1}${String(d.getDate()).padStart(2, "0")}-${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`;
    return `${yyyy}-${ts}`;
  }

  const disabled = !periodValid || preview.count === 0 || emit.isPending;

  return (
    <Card>
      <SectionLabel>{t.emit}</SectionLabel>
      <div className="mt-3 grid grid-cols-2 gap-3">
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

      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2 border-t border-(--color-border) pt-4">
        <span className="text-xs uppercase tracking-wider text-(--color-text-muted)">
          {t.attivita}: {preview.count} · {t.totale}
        </span>
        <span className="font-mono text-2xl font-semibold text-(--color-text) tabular-nums">
          {formatEuro(preview.totaleConto)}
        </span>
      </div>

      {!periodValid ? (
        <p className="mt-3 text-xs text-(--color-danger)" role="alert">
          Il periodo finale deve essere dopo l&apos;iniziale.
        </p>
      ) : null}
      {preview.count === 0 && periodValid ? (
        <p className="mt-3 text-xs text-(--color-text-muted)">
          {t.noActivities}
        </p>
      ) : null}

      <Toolbar gap="sm" align="end" className="mt-4">
        {canProforma ? (
          <Button
            type="button"
            variant="secondary"
            disabled={disabled}
            onClick={() => void doEmit("proforma")}
          >
            {t.emitProforma}
          </Button>
        ) : null}
        {canEmit ? (
          <Button
            type="button"
            variant="primary"
            disabled={disabled}
            onClick={() => setConfirmingEmit(true)}
          >
            {t.emit}
          </Button>
        ) : null}
      </Toolbar>

      <ConfirmDialog
        open={confirmingEmit}
        title={t.emit}
        message={t.confermaEmessi}
        confirmLabel={t.emetti}
        cancelLabel={t.annulla}
        variant="primary"
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
