import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Dialog, InlineError } from "../../../shared/ui";
import { RHFTextField } from "../../../shared/ui/rhf";
import { useAuthState } from "../../auth";
import { aziendaInputSchema, type Azienda, type AziendaInput } from "@vet/shared";
import { useCreateAzienda } from "../hooks/useAziende";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (azienda: Azienda) => void;
  initialNome?: string;
}

type FormValues = { nome: string };

export function QuickAddAziendaDialog({
  open,
  onClose,
  onCreated,
  initialNome = "",
}: Props) {
  const { user } = useAuthState();
  const create = useCreateAzienda();
  const form = useForm<FormValues>({
    resolver: zodResolver(aziendaInputSchema),
    defaultValues: { nome: initialNome },
    mode: "onSubmit",
  });
  const busy = create.isPending || form.formState.isSubmitting;
  const rootError = form.formState.errors.root?.message;

  async function onSubmit(values: FormValues) {
    if (!user) return;
    try {
      const input: AziendaInput = { nome: values.nome };
      const created = await create.mutateAsync({ input, actor: user });
      onCreated(created);
      form.reset({ nome: "" });
      onClose();
    } catch (err) {
      console.error("quick add azienda failed", err);
      form.setError("root", {
        message: err instanceof Error ? err.message : "Salvataggio non riuscito",
      });
    }
  }

  function handleClose() {
    if (busy) return;
    form.reset({ nome: "" });
    form.clearErrors();
    onClose();
  }

  return (
    <Dialog open={open} onClose={handleClose} labelledBy="quick-azienda-title" size="sm">
      <FormProvider {...form}>
        <form
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
          className="p-5 space-y-4"
        >
          <div>
            <h2 id="quick-azienda-title" className="text-base font-medium text-(--color-text)">
              Nuova azienda
            </h2>
            <p className="text-xs text-(--color-text-muted) mt-1">
              Solo il nome è obbligatorio. Gli altri campi li puoi compilare dopo.
            </p>
          </div>
          <RHFTextField<FormValues>
            name="nome"
            label="Nome"
            required
            autoFocus
            disabled={busy}
            placeholder="Nome azienda"
          />
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

function SubmitButton({ busy }: { busy: boolean }) {
  const nome = useWatch<FormValues>({ name: "nome" }) ?? "";
  return (
    <Button type="submit" variant="primary" disabled={busy || !nome.trim()}>
      Crea
    </Button>
  );
}
