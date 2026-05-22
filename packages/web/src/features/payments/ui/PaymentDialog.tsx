import { useState, type FormEvent } from "react";
import {
  Button,
  Dialog,
  InlineError,
  Select,
  TextArea,
  TextField,
} from "../../../shared/ui";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { useAuthState } from "../../auth";
import { paymentsI18n as t } from "../i18n";
import {
  METODI_PAGAMENTO,
  paymentInputSchema,
  type MetodoPagamento,
} from "@vet/shared";
import { dateInputValue, parseDateInput } from "../../attivita/lib/format";
import type { AziendaArrears } from "../lib/arrears";

const METODI_OPTIONS = [
  { value: "", label: "—" },
  { value: "bonifico", label: t.metodoBonifico },
  { value: "contanti", label: t.metodoContanti },
  { value: "altro", label: t.metodoAltro },
];

export function PaymentDialog({
  row,
  onClose,
  onSaved,
}: {
  row: AziendaArrears;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const { user } = useAuthState();
  const { payments } = useRepositories();
  const [periodo, setPeriodo] = useState(dateInputValue(new Date()));
  const [importo, setImporto] = useState(
    row.unpaidTotal > 0 ? String(row.unpaidTotal) : ""
  );
  const [metodo, setMetodo] = useState<MetodoPagamento | "">("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    const date = parseDateInput(periodo);
    if (!date) {
      setError(t.saveError);
      return;
    }
    const importoTrim = importo.trim();
    const noteTrim = note.trim();
    const parsed = paymentInputSchema.safeParse({
      aziendaId: row.azienda.id,
      periodoFinoA: date,
      ...(importoTrim ? { importoPagato: Number(importoTrim) } : {}),
      ...(metodo ? { metodoPagamento: metodo } : {}),
      ...(noteTrim ? { note: noteTrim } : {}),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t.saveError);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await payments.create(
        parsed.data,
        { aziendaNome: row.azienda.nome },
        user
      );
      await onSaved();
    } catch {
      setError(t.saveError);
      setBusy(false);
    }
  }

  return (
    <Dialog open onClose={onClose} labelledBy="payment-dialog-title" size="md">
      <div className="p-5">
        <h2
          id="payment-dialog-title"
          className="text-base font-medium text-(--color-text)"
        >
          {row.azienda.nome}
        </h2>
        <p className="text-sm text-(--color-text-muted) mt-1">
          {t.segnaPagato}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4 mt-5">
          <TextField
            id="pay-periodo"
            type="date"
            label={t.campoPeriodoFinoA}
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            required
            disabled={busy}
          />
          <div className="grid grid-cols-2 gap-3">
            <TextField
              id="pay-importo"
              type="number"
              step="0.01"
              min="0"
              label={t.campoImporto}
              value={importo}
              onChange={(e) => setImporto(e.target.value)}
              disabled={busy}
            />
            <Select
              id="pay-metodo"
              label={t.campoMetodo}
              value={metodo}
              onChange={(e) =>
                setMetodo(
                  METODI_PAGAMENTO.includes(e.target.value as MetodoPagamento)
                    ? (e.target.value as MetodoPagamento)
                    : ""
                )
              }
              options={METODI_OPTIONS}
              disabled={busy}
            />
          </div>
          <TextArea
            id="pay-note"
            label={t.campoNote}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={busy}
            maxLength={500}
          />
          {error ? <InlineError>{error}</InlineError> : null}
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={busy}
            >
              {t.annulla}
            </Button>
            <Button type="submit" variant="primary" disabled={busy}>
              {t.salva}
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}
