import { useEffect, useRef } from "react";
import {
  FormProvider,
  useForm,
  useFormContext,
  useWatch,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Dialog, InlineError } from "../../../shared/ui";
import { RHFTextField } from "../../../shared/ui/rhf";
import {
  activityTypeInputSchema,
  modalitaSchema,
  slugify,
  type ActivityType,
} from "@vet/shared";
import { useCreateTipoAttivita } from "../hooks/useActivityTypes";

const quickTipoFormSchema = z.object({
  nome: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1, "Nome obbligatorio").max(80)),
  tariffa: z.string().superRefine((value, ctx) => {
    const trimmed = value.trim();
    if (trimmed === "") return;
    const num = Number(trimmed);
    if (!Number.isFinite(num) || num < 0 || num > 100000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Tariffa non valida",
      });
    }
  }),
  modalitaDefault: z.union([modalitaSchema, z.literal("")]),
});

type QuickTipoFormValues = z.infer<typeof quickTipoFormSchema>;

const EMPTY: QuickTipoFormValues = {
  nome: "",
  tariffa: "",
  modalitaDefault: "",
};

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (tipo: ActivityType) => void;
  nextOrdine: number;
}

export function QuickAddTipoDialog({ open, onClose, onCreated, nextOrdine }: Props) {
  const createTipo = useCreateTipoAttivita();
  const form = useForm<QuickTipoFormValues>({
    resolver: zodResolver(quickTipoFormSchema),
    defaultValues: EMPTY,
    mode: "onSubmit",
  });

  const busy = createTipo.isPending;
  const wasOpenRef = useRef(open);
  useEffect(() => {
    if (open && !wasOpenRef.current) form.reset(EMPTY);
    wasOpenRef.current = open;
  }, [open, form]);

  async function onSubmit(values: QuickTipoFormValues) {
    const tariffaTrim = values.tariffa.trim();
    const tariffaNum = tariffaTrim === "" ? undefined : Number(tariffaTrim);
    const id = slugify(values.nome);
    if (!id) {
      form.setError("nome", { message: "Nome non valido" });
      return;
    }
    const parsed = activityTypeInputSchema.safeParse({
      nome: values.nome,
      ordine: nextOrdine,
      attivo: true,
      ...(tariffaNum !== undefined ? { tariffaStandard: tariffaNum } : {}),
      ...(values.modalitaDefault !== ""
        ? { modalitaDefault: values.modalitaDefault }
        : {}),
    });
    if (!parsed.success) {
      form.setError("root", {
        message: parsed.error.issues[0]?.message ?? "Dati non validi",
      });
      return;
    }
    try {
      const created = await createTipo.mutateAsync({ id, input: parsed.data });
      onCreated(created);
      form.reset(EMPTY);
      onClose();
    } catch (err) {
      console.error("quick add tipo failed", err);
      form.setError("root", {
        message: err instanceof Error ? err.message : "Salvataggio non riuscito",
      });
    }
  }

  function handleClose() {
    if (busy) return;
    form.reset(EMPTY);
    onClose();
  }

  const rootError = form.formState.errors.root?.message;

  return (
    <Dialog open={open} onClose={handleClose} labelledBy="quick-tipo-title" size="sm">
      <FormProvider {...form}>
        <form
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
          className="p-5 space-y-4"
        >
          <div>
            <h2 id="quick-tipo-title" className="text-base font-medium text-(--color-text)">
              Nuovo tipo di attività
            </h2>
            <p className="text-xs text-(--color-text-muted) mt-1">
              Sarà disponibile in tutti i form. Puoi modificare ordine e tariffa dopo.
            </p>
          </div>
          <RHFTextField<QuickTipoFormValues>
            name="nome"
            idPrefix="quick-tipo"
            label="Nome"
            required
            autoFocus
            disabled={busy}
            placeholder="Es. Cesareo"
          />
          <RHFTextField<QuickTipoFormValues>
            name="tariffa"
            idPrefix="quick-tipo"
            label="Tariffa standard (€)"
            type="number"
            step="10"
            min="0"
            disabled={busy}
            placeholder="opzionale"
            hint="Lascia vuoto se la tariffa cambia di volta in volta."
          />
          <ModalitaDefaultField disabled={busy} />
          {rootError ? <InlineError>{rootError}</InlineError> : null}
          <div className="flex items-center justify-end gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={busy}>
              Annulla
            </Button>
            <SubmitButton busy={busy} />
          </div>
        </form>
      </FormProvider>
    </Dialog>
  );
}

const MODALITA_OPTIONS: ReadonlyArray<{
  value: "" | "fissa" | "oraria" | "adElemento";
  label: string;
  hint: string;
}> = [
  { value: "", label: "Nessuna", hint: "Il vet sceglie ogni volta" },
  { value: "fissa", label: "Fissa", hint: "Tariffa una tantum" },
  { value: "oraria", label: "Oraria", hint: "Tariffa × ore" },
  { value: "adElemento", label: "Per elemento", hint: "Tariffa × quantità" },
];

function ModalitaDefaultField({ disabled }: { disabled: boolean }) {
  const { setValue } = useFormContext<QuickTipoFormValues>();
  const current = useWatch<QuickTipoFormValues>({ name: "modalitaDefault" }) ?? "";
  return (
    <div>
      <span className="block text-xs uppercase tracking-wider text-(--color-text-muted) mb-1.5">
        Modalità predefinita
      </span>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {MODALITA_OPTIONS.map((opt) => {
          const active = current === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              title={opt.hint}
              onClick={() =>
                setValue("modalitaDefault", opt.value, {
                  shouldValidate: false,
                })
              }
              className={[
                "rounded-md border px-2.5 py-1.5 text-xs text-left transition-colors",
                active
                  ? "border-(--color-accent) bg-(--color-accent-soft) text-(--color-text)"
                  : "border-(--color-border) text-(--color-text-muted) hover:text-(--color-text) hover:border-(--color-border-strong)",
                disabled ? "opacity-50 cursor-not-allowed" : "",
              ].join(" ")}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SubmitButton({ busy }: { busy: boolean }) {
  const nome = useWatch<QuickTipoFormValues>({ name: "nome" }) ?? "";
  return (
    <Button type="submit" variant="primary" disabled={busy || !nome.trim()}>
      Crea
    </Button>
  );
}
