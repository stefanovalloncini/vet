import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Dialog, InlineError } from "../../../shared/ui";
import { RHFSelect, RHFTextArea, RHFTextField } from "../../../shared/ui/rhf";
import { useAuthState } from "../../auth";
import { paymentsI18n as t } from "../i18n";
import {
  METODI_PAGAMENTO,
  paymentInputSchema,
  type MetodoPagamento,
  type PaymentInput,
} from "@vet/shared";
import { dateInputValue, parseDateInput } from "../../../shared/lib/format";
import { useCreatePayment } from "../hooks/usePayments";
import type { AziendaArrears } from "../lib/arrears";

const METODI_OPTIONS = [
  { value: "", label: "—" },
  { value: "bonifico", label: t.metodoBonifico },
  { value: "contanti", label: t.metodoContanti },
  { value: "altro", label: t.metodoAltro },
];

const formSchema = z.object({
  periodo: z.string().min(1, "Data obbligatoria"),
  importo: z.string().superRefine((value, ctx) => {
    if (value.trim() === "") return;
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0 || num > 1_000_000) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Importo non valido" });
    }
  }),
  metodo: z.string(),
  note: z.string().max(500),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  row: AziendaArrears;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}

export function PaymentDialog({ row, onClose, onSaved }: Props) {
  const { user } = useAuthState();
  const create = useCreatePayment();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      periodo: dateInputValue(new Date()),
      importo: row.unpaidTotal > 0 ? String(row.unpaidTotal) : "",
      metodo: "",
      note: "",
    },
    mode: "onSubmit",
  });
  const busy = create.isPending || form.formState.isSubmitting;
  const rootError = form.formState.errors.root?.message;

  async function onSubmit(values: FormValues) {
    if (!user) return;
    form.clearErrors("root");
    const date = parseDateInput(values.periodo);
    if (!date) {
      form.setError("periodo", { message: "Data non valida" });
      return;
    }
    const importoTrim = values.importo.trim();
    const noteTrim = values.note.trim();
    const metodo = METODI_PAGAMENTO.includes(values.metodo as MetodoPagamento)
      ? (values.metodo as MetodoPagamento)
      : undefined;
    const parsed = paymentInputSchema.safeParse({
      aziendaId: row.azienda.id,
      periodoFinoA: date,
      ...(importoTrim ? { importoPagato: Number(importoTrim) } : {}),
      ...(metodo ? { metodoPagamento: metodo } : {}),
      ...(noteTrim ? { note: noteTrim } : {}),
    });
    if (!parsed.success) {
      form.setError("root", {
        message: parsed.error.issues[0]?.message ?? t.saveError,
      });
      return;
    }
    try {
      const input: PaymentInput = parsed.data;
      await create.mutateAsync({
        input,
        denorm: { aziendaNome: row.azienda.nome },
        actor: user,
      });
      await onSaved();
    } catch (err) {
      console.error("payment create failed", err);
      form.setError("root", { message: t.saveError });
    }
  }

  return (
    <Dialog open onClose={onClose} labelledBy="payment-dialog-title" size="md">
      <FormProvider {...form}>
        <div className="p-5">
          <h2
            id="payment-dialog-title"
            className="text-base font-medium text-(--color-text)"
          >
            {row.azienda.nome}
          </h2>
          <p className="text-sm text-(--color-text-muted) mt-1">{t.segnaPagato}</p>
          <form
            noValidate
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-5"
          >
            <RHFTextField<FormValues>
              name="periodo"
              type="date"
              label={t.campoPeriodoFinoA}
              required
              disabled={busy}
            />
            <div className="grid grid-cols-2 gap-3">
              <RHFTextField<FormValues>
                name="importo"
                type="number"
                step="0.01"
                min="0"
                label={t.campoImporto}
                disabled={busy}
              />
              <RHFSelect<FormValues>
                name="metodo"
                label={t.campoMetodo}
                options={METODI_OPTIONS}
                disabled={busy}
              />
            </div>
            <RHFTextArea<FormValues>
              name="note"
              label={t.campoNote}
              disabled={busy}
              maxLength={500}
            />
            {rootError ? <InlineError>{rootError}</InlineError> : null}
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
      </FormProvider>
    </Dialog>
  );
}
