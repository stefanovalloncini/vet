import { useMemo, useState } from "react";
import type { Attivita, Azienda } from "@vet/shared";
import {
  Button,
  Card,
  ConfirmDialog,
  SectionLabel,
  Toolbar,
  useToast,
} from "../../../shared/ui";
import { useAuthState } from "../../auth";
import {
  dateInputValue,
  formatEuro,
  parseDateInput,
} from "../../../shared/lib/format";
import { roundCents } from "../../../shared/lib/money";
import { useEmettiConto } from "../hooks/useConti";
import { useArmadietto } from "../hooks/useArmadietto";
import { contiI18n as t } from "../i18n";
import { computeContoPreview, defaultPeriodoFor } from "../lib/contoPreview";
import { contoFilenameStem, contoNumeroFor } from "../lib/contoDocMeta";
import { ArmadiettoRow } from "./ArmadiettoRow";
import { PeriodPicker } from "./PeriodPicker";

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

  const armadietto = useArmadietto(azienda, fromDate, toDate);
  const armadiettoImporto =
    armadietto.attivo && armadietto.importoNum !== null
      ? armadietto.importoNum
      : undefined;
  const grandTotal = roundCents(preview.totaleConto + (armadiettoImporto ?? 0));
  const hasContent = preview.count > 0 || armadiettoImporto !== undefined;

  const canProforma = user?.caps.has("conti.proforma") ?? false;
  const canEmit = user?.caps.has("conti.emit") ?? false;

  if (!canProforma && !canEmit) return null;

  async function doEmit(modalita: "proforma" | "emesso"): Promise<void> {
    if (!user || !fromDate || !toDate || !hasContent) return;
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
          ...(armadiettoImporto !== undefined ? { armadiettoImporto } : {}),
        },
        denorm: {
          aziendaNome: azienda.nome,
          attivitaIds: preview.attivitaIds,
          totaleConto: grandTotal,
        },
        actor: user,
      });
    } catch {
      // Error toast handled by global mutation handler (meta.errorMessage)
      return;
    }

    notify(
      modalita === "proforma" ? "Pro forma generato" : "Conto emesso",
      "success"
    );

    const emessoIl = new Date();
    const periodo = { from: fromDate, to: endOfDay };
    const filenameStem = contoFilenameStem({
      modalita,
      aziendaNomeNorm: azienda.nomeNorm,
      emessoIl,
    });
    try {
      const pdf = await import("../../../shared/pdf");
      if (modalita === "proforma") {
        await pdf.downloadPdf(
          <pdf.ProformaDocument
            data={{
              azienda,
              righe: includedAttivita,
              periodo,
              emessoIl,
              emessoDa: { uid: user.uid, displayName: user.displayName },
              ...(armadiettoImporto !== undefined
                ? { armadietto: armadiettoImporto }
                : {}),
              totale: grandTotal,
            }}
          />,
          filenameStem
        );
      } else {
        await pdf.downloadPdf(
          <pdf.ContoDocument
            data={{
              azienda,
              righe: includedAttivita,
              periodo,
              emessoIl,
              emessoDa: { uid: user.uid, displayName: user.displayName },
              numero: contoNumeroFor(emessoIl),
              ...(armadiettoImporto !== undefined
                ? { armadietto: armadiettoImporto }
                : {}),
              totale: grandTotal,
            }}
          />,
          filenameStem
        );
      }
    } catch {
      notify(t.pdfFallito, "error");
    }
  }

  const disabled = !periodValid || !hasContent || emit.isPending;

  function applyRange(nextFrom: Date, nextTo: Date): void {
    setFrom(dateInputValue(nextFrom));
    setTo(dateInputValue(nextTo));
  }

  return (
    <Card>
      <SectionLabel>{t.emit}</SectionLabel>

      <div className="mt-3">
        <PeriodPicker
          from={from}
          to={to}
          onChange={applyRange}
          onCustomFromChange={setFrom}
          onCustomToChange={setTo}
          {...(azienda.cadenzaFatturazione
            ? { cadenza: azienda.cadenzaFatturazione }
            : {})}
        />
      </div>

      {armadietto.applicable ? <ArmadiettoRow state={armadietto} /> : null}

      <div
        role="status"
        aria-live="polite"
        className="mt-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-(--color-border) pt-4"
      >
        <span className="text-xs uppercase tracking-wider text-(--color-text-muted) tabular-nums">
          {armadiettoImporto !== undefined
            ? `${t.attivitaSubtotale} ${formatEuro(preview.totaleConto)} · ${t.armadietto} ${formatEuro(armadiettoImporto)}`
            : `${t.attivita}: ${preview.count} · ${t.totale}`}
        </span>
        <span className="font-mono text-2xl font-semibold text-(--color-text) tabular-nums whitespace-nowrap">
          {formatEuro(grandTotal)}
        </span>
      </div>

      {!periodValid ? (
        <p className="mt-3 text-xs text-(--color-danger)" role="alert">
          Il periodo finale deve essere dopo l&apos;iniziale.
        </p>
      ) : null}
      {preview.count === 0 && armadiettoImporto === undefined && periodValid ? (
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
