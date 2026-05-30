import { useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AddLink,
  AppShell,
  Button,
  ConfirmDialog,
  FormFooter,
  InlineError,
  PageHeader,
  Spinner,
} from "../../../shared/ui";
import { formatDate } from "../../../shared/lib/format";
import { useAuthState } from "../../auth";
import { useReferenceData } from "../hooks/useReferenceData";
import {
  useAttivitaDerived,
  useAttivitaHydration,
  useAttivitaSubmit,
  useExistingAttivita,
} from "../hooks/useAttivitaForm";
import { QuickAddAziendaDialog } from "../../aziende";
import { QuickAddTipoDialog, nextOrdine } from "../../activity-types";
import { attivitaI18n as t } from "../i18n";
import {
  attivitaFormSchema,
  emptyFormValues,
  type AttivitaFormValues,
} from "../lib/formSchema";
import { AttivitaFormFields } from "./AttivitaFormFields";
import { routes } from "../../../routes";

export function AttivitaFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const cloneId = params.get("clone");
  const presetDate = params.get("data");
  const isEdit = id !== undefined;
  const targetId = id ?? cloneId ?? undefined;

  const { user } = useAuthState();
  const ref = useReferenceData();
  const existing = useExistingAttivita(targetId);

  const form = useForm<AttivitaFormValues>({
    resolver: zodResolver(attivitaFormSchema),
    defaultValues: emptyFormValues(presetDate),
    mode: "onSubmit",
  });

  useAttivitaHydration({ form, existing, isEdit, targetId });
  const submit = useAttivitaSubmit({
    form,
    id,
    isEdit,
    user,
    aziende: ref.aziende,
    tipi: ref.tipi,
  });
  const derived = useAttivitaDerived({ form, tipi: ref.tipi, isEdit });

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [addAziendaOpen, setAddAziendaOpen] = useState(false);
  const [addTipoOpen, setAddTipoOpen] = useState(false);

  const aziendaOptions = useMemo(
    () => [
      { value: "", label: t.selezionaAzienda },
      ...ref.aziende.map((a) => ({ value: a.id, label: a.nome })),
    ],
    [ref.aziende]
  );
  const tipoOptions = useMemo(
    () => [
      { value: "", label: t.selezionaTipo },
      ...ref.tipi.map((tipo) => ({ value: tipo.id, label: tipo.nome })),
    ],
    [ref.tipi]
  );
  const nextTipoOrdine = useMemo(() => nextOrdine(ref.tipi), [ref.tipi]);

  const canDelete =
    isEdit &&
    (user?.caps.has("activities.delete.own") ?? false) &&
    existing.data?.ownerUid === user?.uid;
  const canCreateAzienda = user?.caps.has("aziende.create") ?? false;
  const canCreateTipo = user?.caps.has("activity_types.manage") ?? false;

  if (existing.isLoading || ref.loading) {
    return (
      <AppShell>
        <PageHeader
          title={isEdit ? t.titoloModifica : t.titoloNuova}
          back={{ to: "/attivita", label: t.back }}
        />
        <div className="flex min-h-40 items-center justify-center">
          <Spinner label={t.loading} />
        </div>
      </AppShell>
    );
  }

  const rootError = form.formState.errors.root?.message;

  return (
    <AppShell>
      <PageHeader
        title={isEdit ? t.titoloModifica : t.titoloNuova}
        back={{ to: "/attivita", label: t.back }}
      />
      <FormProvider {...form}>
        <form
          noValidate
          onSubmit={form.handleSubmit(submit.onSubmit)}
          className="space-y-6 max-w-[760px]"
        >
          <AttivitaFormFields
            busy={submit.busy}
            isEdit={isEdit}
            tariffaSuggested={derived.tariffaSuggested}
            totaleLive={derived.totaleLive}
            aziendaOptions={aziendaOptions}
            tipoOptions={tipoOptions}
            aziendaAction={
              canCreateAzienda ? (
                <AddLink onClick={() => setAddAziendaOpen(true)} label="+ Nuova" />
              ) : null
            }
            tipoAction={
              canCreateTipo ? (
                <AddLink onClick={() => setAddTipoOpen(true)} label="+ Nuovo" />
              ) : null
            }
          />
          {rootError ? <InlineError>{rootError}</InlineError> : null}
          <FormActions
            busy={submit.busy}
            destructive={
              canDelete ? (
                <DeleteActions
                  busy={submit.busy}
                  onDuplicate={() => navigate(`${routes.attivitaNew.to()}?clone=${id}`)}
                  onDelete={() => setConfirmDelete(true)}
                />
              ) : null
            }
            onCancel={() => navigate("/attivita")}
          />
        </form>
      </FormProvider>
      {isEdit && existing.data ? (
        <p className="max-w-[760px] mt-6 pt-4 border-t border-(--color-border) text-xs text-(--color-text-subtle)">
          Registrato da {existing.data.ownerName} il{" "}
          {formatDate(existing.data.createdAt)}
          {existing.data.updatedByName ? (
            <>
              {" · "}Modificato da {existing.data.updatedByName} il{" "}
              {formatDate(existing.data.updatedAt)}
            </>
          ) : null}
        </p>
      ) : null}
      <QuickAddAziendaDialog
        open={addAziendaOpen}
        onClose={() => setAddAziendaOpen(false)}
        onCreated={(a) => {
          ref.addAzienda(a);
          form.setValue("aziendaId", a.id, { shouldValidate: true });
        }}
      />
      <QuickAddTipoDialog
        open={addTipoOpen}
        onClose={() => setAddTipoOpen(false)}
        nextOrdine={nextTipoOrdine}
        onCreated={(tp) => {
          ref.addTipo(tp);
          form.setValue("tipoId", tp.id, { shouldValidate: true });
        }}
      />
      <ConfirmDialog
        open={confirmDelete}
        title="Eliminare questa attività?"
        message={t.confermaEliminazione}
        confirmLabel={t.elimina}
        cancelLabel={t.annulla}
        variant="danger"
        busy={submit.busy}
        onConfirm={() => {
          setConfirmDelete(false);
          void submit.handleDelete();
        }}
        onClose={() => setConfirmDelete(false)}
      />
    </AppShell>
  );
}

function DeleteActions({
  busy,
  onDuplicate,
  onDelete,
}: {
  busy: boolean;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="ghost" size="sm" onClick={onDuplicate} disabled={busy}>
        Duplica
      </Button>
      <Button type="button" variant="ghost" onClick={onDelete} disabled={busy}>
        {t.elimina}
      </Button>
    </div>
  );
}

function FormActions({
  busy,
  destructive,
  onCancel,
}: {
  busy: boolean;
  destructive: ReactNode;
  onCancel: () => void;
}) {
  return (
    <FormFooter
      destructive={destructive}
      actions={
        <>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
            {t.annulla}
          </Button>
          <Button type="submit" variant="primary" disabled={busy}>
            {t.salva}
          </Button>
        </>
      }
    />
  );
}
