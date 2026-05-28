import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import { normalizeAziendaNome, type AziendaInput } from "@vet/shared";
import {
  AppShell,
  Button,
  ConfirmDialog,
  FormFooter,
  InlineError,
  LoadingHint,
  PageHeader,
  useToast,
} from "../../../shared/ui";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { useAuthState } from "../../auth";
import {
  useAzienda,
  useCreateAzienda,
  useDeleteAzienda,
  useUpdateAzienda,
} from "../hooks/useAziende";
import { aziendeI18n as t } from "../i18n";
import { AziendaFormFields } from "./AziendaFormFields";
import {
  aziendaFormSchema,
  emptyAziendaForm,
  formFromAzienda,
  formToAziendaInput,
  type AziendaFormValues,
} from "../lib/formSchema";

export function AziendaFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== undefined;
  const navigate = useNavigate();
  const { user } = useAuthState();
  const { aziende: repo } = useRepositories();
  const { notify } = useToast();
  const azienda = useAzienda(id);
  const create = useCreateAzienda();
  const update = useUpdateAzienda();
  const del = useDeleteAzienda();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const form = useForm<AziendaFormValues>({
    resolver: zodResolver(aziendaFormSchema),
    defaultValues: emptyAziendaForm,
    mode: "onSubmit",
  });

  const hydratedRef = useRef(false);
  useEffect(() => {
    if (!isEdit || hydratedRef.current) return;
    if (azienda.isSuccess && azienda.data === null) {
      navigate("/aziende", { replace: true });
      return;
    }
    if (!azienda.data) return;
    form.reset(formFromAzienda(azienda.data));
    hydratedRef.current = true;
  }, [isEdit, azienda.isSuccess, azienda.data, form, navigate]);

  const busy = create.isPending || update.isPending || del.isPending;
  const canDelete = isEdit && (user?.caps.has("aziende.update") ?? false);

  async function ensureUnique(input: AziendaInput): Promise<boolean> {
    const norm = normalizeAziendaNome(input.nome);
    const loaded = azienda.data ?? null;
    if (isEdit && loaded && loaded.nomeNorm === norm) return true;
    const existing = await repo.findByNomeNorm(norm);
    if (existing && existing.id !== id) {
      form.setError("nome", { message: t.erroreNomeDuplicato });
      return false;
    }
    return true;
  }

  async function onSubmit(values: AziendaFormValues): Promise<void> {
    if (!user) return;
    const input = formToAziendaInput(values);
    if (!(await ensureUnique(input))) return;
    try {
      if (isEdit && id) {
        await update.mutateAsync({ id, input, actor: user });
        notify("Azienda aggiornata", "success");
      } else {
        await create.mutateAsync({ input, actor: user });
        notify("Azienda creata", "success");
      }
      navigate("/aziende");
    } catch {
      form.setError("root", { message: t.erroreSalvataggio });
    }
  }

  async function onDelete(): Promise<void> {
    if (!isEdit || !id || !user) return;
    try {
      await del.mutateAsync({ id, actor: user });
      notify("Azienda archiviata", "success");
      navigate("/aziende");
    } catch {
      form.setError("root", { message: t.erroreSalvataggio });
    }
  }

  const title = isEdit ? t.titoloModifica : t.titoloNuova;
  const header = (
    <PageHeader title={title} back={{ to: "/aziende", label: t.title }} />
  );

  if (isEdit && azienda.isLoading) {
    return (
      <AppShell>
        {header}
        <LoadingHint label={t.loading} />
      </AppShell>
    );
  }

  const rootError = form.formState.errors.root?.message;

  return (
    <AppShell>
      {header}
      <FormProvider {...form}>
        <form
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 max-w-2xl"
        >
          <AziendaFormFields busy={busy} />
          {rootError ? <InlineError>{rootError}</InlineError> : null}
          <FormFooter
            destructive={
              canDelete ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setConfirmDelete(true)}
                  disabled={busy}
                >
                  {t.elimina}
                </Button>
              ) : null
            }
            actions={
              <>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate("/aziende")}
                  disabled={busy}
                >
                  {t.annulla}
                </Button>
                <Button type="submit" variant="primary" disabled={busy}>
                  {t.salva}
                </Button>
              </>
            }
          />
        </form>
      </FormProvider>
      <ConfirmDialog
        open={confirmDelete}
        title="Archiviare questa azienda?"
        message={t.confermaEliminazioneDescr}
        confirmLabel={t.elimina}
        cancelLabel={t.annulla}
        variant="danger"
        busy={busy}
        onConfirm={() => {
          void onDelete();
          setConfirmDelete(false);
        }}
        onClose={() => setConfirmDelete(false)}
      />
    </AppShell>
  );
}
